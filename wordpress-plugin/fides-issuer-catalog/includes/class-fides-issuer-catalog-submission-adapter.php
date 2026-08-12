<?php
/**
 * Registers the issuer catalog with the shared submission core.
 *
 * @package fides-issuer-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Issuer_Catalog_Submission_Adapter')) {
    class Fides_Issuer_Catalog_Submission_Adapter {
        const TYPE = 'issuer';
        const SCHEMA = 'https://fides.community/schemas/issuer-catalog/v1';
        const ID_PATTERN = '/^issuer:[a-z0-9]+:[a-z0-9-]+:(production|test)$/';

        /** @var string[] */
        const ENVIRONMENTS = array('production', 'test');

        /** @var string[] */
        const PROTOCOLS = array('oid4vci', 'other');

        /** @var string[] Source-schema issuer keys; crawler-only fields are deliberately excluded. */
        const ISSUER_KEYS = array(
            'id',
            'displayName',
            'description',
            'environment',
            'issuanceProtocol',
            'oid4vciMetadataUrl',
            'issuerWebsiteUrl',
            'projectContext',
            'supportedWallets',
            'credentialRefs',
        );

        public static function bootstrap(): void {
            add_action('init', array(__CLASS__, 'register'), 6);
            add_filter('fides_catalog_submission_public_item_url', array(__CLASS__, 'filter_public_item_url'), 10, 4);
            add_filter('fides_catalog_github_sync_repos', array(__CLASS__, 'filter_github_repos'));
            add_filter('fides_catalog_github_commit_route_types', array(__CLASS__, 'filter_commit_route_types'), 10, 2);
        }

        public static function register(): void {
            if (! class_exists('Fides_Catalog_Submission_Registry')) {
                return;
            }
            Fides_Catalog_Submission_Registry::register(
                self::TYPE,
                array(
                    'label'                     => __('Issuers', 'fides-issuer-catalog'),
                    'catalog_type'              => self::TYPE,
                    'id_pattern'                => self::ID_PATTERN,
                    'community_filename'        => 'issuer-catalog.json',
                    'slug_from_item_id'         => array(__CLASS__, 'slug_from_item_id'),
                    'slug_from_payload'         => array(__CLASS__, 'slug_from_payload'),
                    'validate_payload'          => array(__CLASS__, 'validate_payload'),
                    'payload_to_export'         => array(__CLASS__, 'payload_to_export'),
                    'catalog_item_to_payload'   => array(__CLASS__, 'catalog_item_to_payload'),
                    'prepare_payload_for_diff'  => array(__CLASS__, 'prepare_payload_for_diff'),
                    'diff_field_labels'         => array(
                        'orgId'                         => 'Organization',
                        'id'                            => 'Issuer id',
                        'displayName'                   => 'Display name',
                        'description'                   => 'Description',
                        'environment'                   => 'Environment',
                        'issuanceProtocol'              => 'Issuance protocol',
                        'oid4vciMetadataUrl'            => 'OID4VCI metadata URL',
                        'issuerWebsiteUrl'              => 'Issuer website URL',
                        'projectContext'                => 'Project context',
                        'supportedWallets'              => 'Supported wallets',
                        'credentialRefs'                => 'Credential references',
                    ),
                )
            );
        }

        /**
         * Add issuer mapping when the installed submission core predates it.
         *
         * @param array<string, string> $repos Repository mappings.
         * @return array<string, string>
         */
        public static function filter_github_repos($repos) {
            $repos = is_array($repos) ? $repos : array();
            if (empty($repos[ self::TYPE ])) {
                $repos[ self::TYPE ] = 'FIDEScommunity/fides-issuer-catalog';
            }
            return $repos;
        }

        /**
         * Use the committed export route consumed by this repository's push workflow.
         *
         * @param string[] $types Catalog types.
         * @param string   $catalog_type Current type.
         * @return string[]
         */
        public static function filter_commit_route_types($types, $catalog_type) {
            $types = is_array($types) ? $types : array();
            if ($catalog_type === self::TYPE && ! in_array(self::TYPE, $types, true)) {
                $types[] = self::TYPE;
            }
            return $types;
        }

        public static function slug_from_item_id($item_id) {
            $existing = self::find_catalog_item((string) $item_id);
            if (is_array($existing)) {
                return self::slug_from_payload(self::catalog_item_to_payload($existing), $item_id);
            }
            return '';
        }

        /**
         * @param array<string, mixed> $payload Submission payload.
         */
        public static function slug_from_payload(array $payload, $item_id) {
            unset($item_id);
            $org_id = sanitize_text_field((string) ($payload['orgId'] ?? ''));
            return strpos($org_id, 'org:') === 0 ? sanitize_title(substr($org_id, 4)) : '';
        }

        /**
         * @param array<string, mixed> $payload Raw payload.
         * @param array<string, mixed> $context Submission context.
         * @return array<string, mixed>|WP_Error
         */
        public static function validate_payload(array $payload, array $context) {
            $action = sanitize_key((string) ($context['action'] ?? 'create'));
            $org_id = sanitize_text_field((string) ($payload['orgId'] ?? ''));
            if (! preg_match('/^org:[a-z0-9]+(?:-[a-z0-9]+)*$/', $org_id)) {
                return self::error(__('Select a valid organization.', 'fides-issuer-catalog'));
            }

            $environment = sanitize_key((string) ($payload['environment'] ?? ''));
            if (! in_array($environment, self::ENVIRONMENTS, true)) {
                return self::error(__('Select production or test as the environment.', 'fides-issuer-catalog'));
            }

            $protocol = sanitize_key((string) ($payload['issuanceProtocol'] ?? ''));
            if (! in_array($protocol, self::PROTOCOLS, true)) {
                return self::error(__('Select an issuance protocol.', 'fides-issuer-catalog'));
            }

            $item_id = $action === 'update'
                ? sanitize_text_field((string) ($context['item_id'] ?? ''))
                : sanitize_text_field((string) ($payload['id'] ?? ''));
            if (! preg_match(self::ID_PATTERN, $item_id)) {
                return self::error(__('Issuer id must use issuer:<orgCode>:<issuerKey>:<environment>.', 'fides-issuer-catalog'));
            }

            $parts = explode(':', $item_id);
            $expected_org_code = str_replace('-', '', substr($org_id, 4));
            if (($parts[1] ?? '') !== $expected_org_code) {
                return self::error(__('Issuer id organization code must match the selected organization.', 'fides-issuer-catalog'));
            }
            if (($parts[3] ?? '') !== $environment) {
                return self::error(__('Issuer id environment must match the selected environment.', 'fides-issuer-catalog'));
            }

            $metadata_url = self::optional_url($payload, 'oid4vciMetadataUrl');
            $website_url  = self::optional_url($payload, 'issuerWebsiteUrl');
            if ($protocol === 'oid4vci' && $metadata_url === '') {
                return self::error(__('OID4VCI metadata URL is required for OID4VCI issuers.', 'fides-issuer-catalog'));
            }

            $wallet_refs     = self::normalize_refs($payload['supportedWallets'] ?? array(), false);
            $credential_refs = self::normalize_refs($payload['credentialRefs'] ?? array(), true);
            if ($protocol === 'other' && empty($credential_refs)) {
                return self::error(__('Select at least one credential for non-OID4VCI issuers.', 'fides-issuer-catalog'));
            }

            $existing = self::find_catalog_item($item_id);
            if ($action === 'create' && is_array($existing)) {
                return self::error(__('This issuer already exists in the catalog.', 'fides-issuer-catalog'));
            }
            if ($action === 'update') {
                $payload_id = sanitize_text_field((string) ($payload['id'] ?? ''));
                if ($payload_id !== '' && $payload_id !== $item_id) {
                    return self::error(__('Issuer id cannot be changed on update.', 'fides-issuer-catalog'));
                }
                if (! is_array($existing)) {
                    return self::error(__('The issuer to update was not found.', 'fides-issuer-catalog'));
                }
                if ((string) ($existing['orgId'] ?? '') !== $org_id) {
                    return self::error(__('Organization cannot be changed on update.', 'fides-issuer-catalog'));
                }
                if ((string) ($existing['environment'] ?? '') !== $environment) {
                    return self::error(__('Environment cannot be changed on update.', 'fides-issuer-catalog'));
                }
            }

            if (! self::organization_exists($org_id)) {
                return self::error(__('The selected organization was not found in the organization catalog.', 'fides-issuer-catalog'));
            }

            $normalized = array(
                'item_id'          => $item_id,
                'orgId'            => $org_id,
                'id'               => $item_id,
                'environment'      => $environment,
                'issuanceProtocol' => $protocol,
            );
            foreach (array('displayName', 'description', 'projectContext') as $key) {
                $value = self::optional_text($payload, $key);
                if ($value !== '') {
                    $normalized[ $key ] = $value;
                }
            }
            if ($protocol === 'oid4vci') {
                $normalized['oid4vciMetadataUrl'] = $metadata_url;
            }
            if ($website_url !== '') {
                $normalized['issuerWebsiteUrl'] = $website_url;
            }
            if (! empty($wallet_refs)) {
                $normalized['supportedWallets'] = $wallet_refs;
            }
            if (! empty($credential_refs)) {
                $normalized['credentialRefs'] = $credential_refs;
            }
            return $normalized;
        }

        /**
         * @param array<string, mixed> $payload Normalized payload.
         * @return array<string, mixed>
         */
        public static function payload_to_export(array $payload) {
            $issuer = array();
            foreach (self::ISSUER_KEYS as $key) {
                if (array_key_exists($key, $payload) && $payload[ $key ] !== '' && $payload[ $key ] !== array()) {
                    $issuer[ $key ] = $payload[ $key ];
                }
            }
            return array(
                '$schema'     => self::SCHEMA,
                'orgId'       => sanitize_text_field((string) ($payload['orgId'] ?? '')),
                'issuers'     => array($issuer),
                'lastUpdated' => gmdate(DATE_ATOM),
            );
        }

        /**
         * @param array<string, mixed> $item Aggregated or source issuer.
         * @return array<string, mixed>
         */
        public static function catalog_item_to_payload(array $item) {
            $payload = array('orgId' => (string) ($item['orgId'] ?? ''));
            foreach (self::ISSUER_KEYS as $key) {
                if (array_key_exists($key, $item) && $item[ $key ] !== '' && $item[ $key ] !== array()) {
                    $payload[ $key ] = $item[ $key ];
                }
            }
            /*
             * Aggregated OID4VCI records omit manual credentialRefs. Do not derive
             * them from credentialConfigurations: that would export crawler data.
             */
            return self::prepare_payload_for_diff($payload);
        }

        /**
         * @param array<string, mixed> $payload Payload.
         * @return array<string, mixed>
         */
        public static function prepare_payload_for_diff(array $payload) {
            foreach (array('supportedWallets', 'credentialRefs') as $key) {
                if (isset($payload[ $key ])) {
                    $payload[ $key ] = self::normalize_refs($payload[ $key ], $key === 'credentialRefs');
                    usort($payload[ $key ], static fn ($a, $b) => strcmp((string) $a['id'], (string) $b['id']));
                }
            }
            return $payload;
        }

        /**
         * @param string $url Current URL.
         */
        public static function filter_public_item_url($url, $catalog_type, $item_id, $payload) {
            unset($payload);
            if ($catalog_type !== self::TYPE || ! preg_match(self::ID_PATTERN, (string) $item_id)) {
                return $url;
            }
            $option = class_exists('Fides_Issuer_Catalog_SSR')
                ? Fides_Issuer_Catalog_SSR::OPTION_CATALOG_URL
                : 'fides_issuer_catalog_page_url';
            $default = class_exists('Fides_Issuer_Catalog_SSR')
                ? Fides_Issuer_Catalog_SSR::DEFAULT_CATALOG_PATH
                : '/ecosystem-explorer/issuer-catalog/';
            $path = get_option($option, $default);
            return add_query_arg('issuer', rawurlencode((string) $item_id), home_url((string) $path));
        }

        /**
         * @param mixed $raw References.
         * @return array<int, array<string, string>>
         */
        private static function normalize_refs($raw, $credentials) {
            if (! is_array($raw)) {
                return array();
            }
            $out = array();
            foreach ($raw as $ref) {
                if (! is_array($ref)) {
                    continue;
                }
                $id = sanitize_text_field((string) ($ref['id'] ?? ''));
                if ($id === '' || ($credentials && ! preg_match('/^cred:[a-z0-9]+:[a-z0-9-]+:[a-z0-9-]+$/', $id))) {
                    continue;
                }
                $entry = array('id' => $id);
                $name = sanitize_text_field((string) ($ref['displayName'] ?? ''));
                if ($name !== '') {
                    $entry['displayName'] = $name;
                }
                $out[ $id ] = $entry;
            }
            return array_values($out);
        }

        private static function optional_url(array $payload, $key) {
            return isset($payload[ $key ]) ? esc_url_raw(trim((string) $payload[ $key ])) : '';
        }

        private static function optional_text(array $payload, $key) {
            return isset($payload[ $key ]) ? sanitize_textarea_field((string) $payload[ $key ]) : '';
        }

        private static function error($message) {
            return new WP_Error('fides_issuer_invalid', $message);
        }

        private static function find_catalog_item($item_id) {
            if (class_exists('Fides_Catalog_Submission_Lookups')) {
                $item = Fides_Catalog_Submission_Lookups::find_item_by_id(self::TYPE, $item_id);
                return is_array($item) ? $item : null;
            }
            return null;
        }

        private static function organization_exists($org_id) {
            if (! class_exists('Fides_Catalog_Source') || ! class_exists('Fides_Catalog_Registry')
                || ! Fides_Catalog_Registry::exists('organization')) {
                return true;
            }
            $source = Fides_Catalog_Source::for('organization');
            return ! $source || is_array($source->find_by_id($org_id));
        }
    }
}
