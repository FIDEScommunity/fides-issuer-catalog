<?php
/**
 * Local WordPress smoke tests for issuer catalog submissions.
 *
 * Run only after syncing the plugin:
 * php scripts/smoke-test-submissions.php
 */

declare(strict_types=1);

$wp_root = getenv('FIDES_WP_ROOT') ?: '/Users/victorvanderhulst/Local Sites/utrecht-demo/app/public';
$socket  = getenv('FIDES_WP_MYSQL_SOCKET') ?: '/Users/victorvanderhulst/Library/Application Support/Local/run/buO_mZaLl/mysql/mysqld.sock';
if (! is_readable($wp_root . '/wp-load.php')) {
    fwrite(STDERR, "WP root not found: {$wp_root}\n");
    exit(1);
}
if (! is_readable($socket)) {
    fwrite(STDERR, "MySQL socket not found (is Local running?): {$socket}\n");
    exit(1);
}

$_SERVER['HTTP_HOST']   = 'utrecht-demo.local';
$_SERVER['REQUEST_URI'] = '/';
if (! defined('DB_HOST')) {
    define('DB_HOST', 'localhost:' . $socket);
}
require $wp_root . '/wp-load.php';

$failures = 0;
$created_rows = array();

function issuer_smoke_assert(bool $condition, string $message): void {
    if (! $condition) {
        throw new RuntimeException($message);
    }
}

function issuer_smoke(string $name, callable $callback): void {
    global $failures;
    try {
        $detail = (string) $callback();
        echo "PASS  {$name}" . ($detail !== '' ? " — {$detail}" : '') . "\n";
    } catch (Throwable $error) {
        $failures++;
        echo "FAIL  {$name} — {$error->getMessage()}\n";
    }
}

function issuer_smoke_data($response): array {
    if ($response instanceof WP_Error) {
        throw new RuntimeException($response->get_error_message());
    }
    $data = rest_get_server()->response_to_data($response, false);
    return is_array($data) ? $data : array();
}

function issuer_smoke_lookup(string $type, string $query): array {
    $request = new WP_REST_Request('GET', "/fides-catalog/v1/lookups/{$type}");
    $request->set_url_params(array('type' => $type));
    $request->set_param('q', $query);
    $data = issuer_smoke_data(Fides_Catalog_Submission_REST::handle_lookup($request));
    return isset($data['content']) && is_array($data['content']) ? $data['content'] : array();
}

function issuer_smoke_post(string $action, string $item_id, array $payload): array {
    $route = $action === 'create'
        ? '/fides-catalog/v1/submissions/issuer'
        : '/fides-catalog/v1/submissions/issuer/' . rawurlencode($item_id);
    $request = new WP_REST_Request('POST', $route);
    $url_params = array('type' => 'issuer');
    if ($action === 'update') {
        $url_params['item_id'] = $item_id;
    }
    $request->set_url_params($url_params);
    $request->set_header('Content-Type', 'application/json');
    $request->set_body(wp_json_encode($payload));
    $response = $action === 'create'
        ? Fides_Catalog_Submission_REST::handle_create($request)
        : Fides_Catalog_Submission_REST::handle_update($request);
    $data = issuer_smoke_data($response);
    if (! empty($data['id'])) {
        $GLOBALS['created_rows'][] = (int) $data['id'];
    }
    return $data;
}

wp_set_current_user(1);
$suffix = strtolower(base_convert((string) time(), 10, 36));
$org_hits = issuer_smoke_lookup('organization', 'fides');
$org_id = (string) ($org_hits[0]['id'] ?? '');
$org_code = preg_replace('/[^a-z0-9]/', '', preg_replace('/^org:/', '', $org_id));
$issuer_hits = issuer_smoke_lookup('issuer', 'issuer');
$existing_id = '';
foreach ($issuer_hits as $hit) {
    $candidate = (string) ($hit['id'] ?? '');
    $item = Fides_Catalog_Submission_Lookups::find_item_by_id('issuer', $candidate);
    if (is_array($item) && ($item['issuanceProtocol'] ?? '') === 'oid4vci') {
        $existing_id = $candidate;
        break;
    }
}
$credential_hits = issuer_smoke_lookup('credential', 'credential');
$credential_ref = array(
    'id' => (string) ($credential_hits[0]['id'] ?? ''),
    'displayName' => (string) ($credential_hits[0]['label'] ?? ''),
);

register_shutdown_function(static function (): void {
    foreach (array_unique($GLOBALS['created_rows'] ?? array()) as $row_id) {
        if ($row_id > 0 && class_exists('Fides_Catalog_Submissions')) {
            Fides_Catalog_Submissions::delete((int) $row_id);
            echo "CLEAN deleted smoke submission #{$row_id}\n";
        }
    }
});

issuer_smoke('Registry and adapter', static function (): string {
    issuer_smoke_assert(class_exists('Fides_Issuer_Catalog_Submission_Adapter'), 'Adapter missing');
    issuer_smoke_assert(Fides_Catalog_Submission_Registry::exists('issuer'), 'Issuer type not registered');
    return 'issuer registered';
});

issuer_smoke('Issuer lookup', static function () use ($issuer_hits): string {
    issuer_smoke_assert(count($issuer_hits) > 0, 'Issuer lookup returned no results');
    return count($issuer_hits) . ' result(s)';
});

issuer_smoke('Issuer prefill', static function () use ($existing_id): string {
    issuer_smoke_assert($existing_id !== '', 'No OID4VCI issuer available for prefill');
    $request = new WP_REST_Request('GET', '/fides-catalog/v1/submissions/issuer/item/' . rawurlencode($existing_id));
    $request->set_url_params(array('type' => 'issuer', 'item_id' => $existing_id));
    $data = issuer_smoke_data(Fides_Catalog_Submission_REST::handle_get_item_payload($request));
    issuer_smoke_assert(($data['payload']['id'] ?? '') === $existing_id, 'Prefill id mismatch');
    return $existing_id;
});

issuer_smoke('Create OID4VCI issuer', static function () use ($org_id, $org_code, $suffix): string {
    issuer_smoke_assert($org_id !== '' && $org_code !== '', 'Organization lookup unavailable');
    $id = "issuer:{$org_code}:smoke-oid-{$suffix}:test";
    $data = issuer_smoke_post('create', '', array(
        'orgId' => $org_id,
        'id' => $id,
        'displayName' => 'Smoke OID4VCI Issuer',
        'environment' => 'test',
        'issuanceProtocol' => 'oid4vci',
        'oid4vciMetadataUrl' => 'https://example.test/.well-known/openid-credential-issuer',
    ));
    issuer_smoke_assert(($data['status'] ?? '') === 'received', 'Create was not received');
    return $id;
});

issuer_smoke('Create non-OID4VCI issuer', static function () use ($org_id, $org_code, $suffix, $credential_ref): string {
    issuer_smoke_assert($credential_ref['id'] !== '', 'Credential lookup unavailable');
    $id = "issuer:{$org_code}:smoke-other-{$suffix}:test";
    $data = issuer_smoke_post('create', '', array(
        'orgId' => $org_id,
        'id' => $id,
        'environment' => 'test',
        'issuanceProtocol' => 'other',
        'credentialRefs' => array($credential_ref),
    ));
    issuer_smoke_assert(($data['status'] ?? '') === 'received', 'Create was not received');
    return $id;
});

issuer_smoke('Conditional validation rejects invalid payloads', static function () use ($org_id, $org_code, $suffix): string {
    $oid = Fides_Issuer_Catalog_Submission_Adapter::validate_payload(array(
        'orgId' => $org_id,
        'id' => "issuer:{$org_code}:invalid-oid-{$suffix}:test",
        'environment' => 'test',
        'issuanceProtocol' => 'oid4vci',
    ), array('action' => 'create'));
    $other = Fides_Issuer_Catalog_Submission_Adapter::validate_payload(array(
        'orgId' => $org_id,
        'id' => "issuer:{$org_code}:invalid-other-{$suffix}:test",
        'environment' => 'test',
        'issuanceProtocol' => 'other',
    ), array('action' => 'create'));
    issuer_smoke_assert(is_wp_error($oid) && is_wp_error($other), 'Invalid conditional payload was accepted');
    return 'metadata and credential requirements enforced';
});

issuer_smoke('Update existing issuer', static function () use ($existing_id): string {
    issuer_smoke_assert($existing_id !== '', 'No issuer available for update');
    $item = Fides_Catalog_Submission_Lookups::find_item_by_id('issuer', $existing_id);
    issuer_smoke_assert(is_array($item), 'Existing issuer not found');
    $payload = Fides_Issuer_Catalog_Submission_Adapter::catalog_item_to_payload($item);
    $payload['description'] = 'Temporary automated smoke-test update.';
    $data = issuer_smoke_post('update', $existing_id, $payload);
    issuer_smoke_assert(($data['action'] ?? '') === 'update', 'Update action mismatch');
    return $existing_id;
});

issuer_smoke('Adapter export roundtrip', static function () use ($org_id, $org_code, $suffix, $credential_ref): string {
    $payload = array(
        'orgId' => $org_id,
        'id' => "issuer:{$org_code}:roundtrip-{$suffix}:test",
        'displayName' => 'Roundtrip issuer',
        'description' => 'Roundtrip description',
        'environment' => 'test',
        'issuanceProtocol' => 'other',
        'issuerWebsiteUrl' => 'https://example.test/issuer',
        'projectContext' => 'Smoke test',
        'supportedWallets' => array(array('id' => 'smoke-wallet', 'displayName' => 'Smoke Wallet')),
        'credentialRefs' => array($credential_ref),
    );
    $normalized = Fides_Issuer_Catalog_Submission_Adapter::validate_payload($payload, array('action' => 'create'));
    issuer_smoke_assert(! is_wp_error($normalized), is_wp_error($normalized) ? $normalized->get_error_message() : 'Validation failed');
    $export = Fides_Issuer_Catalog_Submission_Adapter::payload_to_export($normalized);
    $roundtrip = Fides_Issuer_Catalog_Submission_Adapter::catalog_item_to_payload(array_merge(
        array('orgId' => $export['orgId']),
        $export['issuers'][0]
    ));
    issuer_smoke_assert($roundtrip['credentialRefs'][0]['id'] === $credential_ref['id'], 'Credential reference did not roundtrip');
    issuer_smoke_assert(! isset($export['issuers'][0]['credentialConfigurations']), 'Crawler-only field leaked');
    return 'all source fields preserved';
});

issuer_smoke('Form assets and shortcodes', static function (): string {
    issuer_smoke_assert(shortcode_exists('fides_issuer_submit_form'), 'Create shortcode missing');
    issuer_smoke_assert(shortcode_exists('fides_issuer_update_form'), 'Update shortcode missing');
    $base = dirname(__DIR__) . '/wordpress-plugin/fides-issuer-catalog/assets/';
    issuer_smoke_assert(is_readable($base . 'issuer-form.js'), 'Form JavaScript missing');
    issuer_smoke_assert(is_readable($base . 'issuer-form.css'), 'Form CSS missing');
    return 'assets and shortcodes available';
});

echo "\nSummary: {$failures} failed\n";
exit($failures > 0 ? 1 : 0);
