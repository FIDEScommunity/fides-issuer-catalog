<?php
/**
 * Plugin Name: FIDES Issuer Catalog
 * Description: Searchable catalog of OID4VCI credential issuers. When the master fides_catalog_ssr_enabled flag (provided by FIDES Community Tools Tiles ≥ 1.6.3) is enabled, the plugin also emits a server-rendered listing fallback, per-deeplink SEO meta tags and an Organization JSON-LD payload so issuer detail URLs become indexable by search engines.
 * Version: 1.6.0
 * Author: FIDES Labs BV
 * License: Apache-2.0
 */

if (!defined('ABSPATH')) exit;

define('FIDES_ISSUER_CATALOG_VERSION', '1.6.0');

require_once plugin_dir_path(__FILE__) . 'includes/class-fides-issuer-catalog-ssr.php';
Fides_Issuer_Catalog_SSR::bootstrap();

/**
 * Detect if the site is running on a .local or localhost URL (local dev).
 * In that case the plugin can use bundled data/aggregated.json instead of GitHub.
 */
function fides_issuer_catalog_is_local_site() {
    $host = '';
    if (function_exists('get_site_url')) {
        $url = get_site_url();
        if (is_string($url)) {
            $parsed = parse_url($url);
            $host = isset($parsed['host']) ? $parsed['host'] : '';
        }
    }
    if ($host === '' && !empty($_SERVER['HTTP_HOST'])) {
        $host = (string) $_SERVER['HTTP_HOST'];
    }
    $host = strtolower(trim($host));
    return ($host !== '' && (preg_match('/\.local$/i', $host) || $host === 'localhost'));
}

/**
 * URL for organization catalog aggregated.json (sector + country maps in issuer UI).
 * Explicit option wins; on local sites, use bundled org plugin JSON if present; else GitHub raw.
 *
 * @param bool $use_local From fides_issuer_catalog_is_local_site().
 */
function fides_issuer_catalog_resolve_organization_data_url($use_local) {
    $github = 'https://raw.githubusercontent.com/FIDEScommunity/fides-organization-catalog/main/data/aggregated.json';
    $opt    = trim((string) get_option('fides_issuer_catalog_organization_data_url', ''));
    if ($opt !== '') {
        return esc_url_raw($opt);
    }
    if ($use_local) {
        $org_main = WP_PLUGIN_DIR . '/fides-organization-catalog/fides-organization-catalog.php';
        $org_json = WP_PLUGIN_DIR . '/fides-organization-catalog/data/aggregated.json';
        if (file_exists($org_json) && file_exists($org_main)) {
            return plugins_url('data/aggregated.json', $org_main);
        }
    }
    return $github;
}

/**
 * URL for credential catalog aggregated.json (theme filter / credential id → themes map in issuer UI).
 */
function fides_issuer_catalog_resolve_credential_aggregated_url($use_local) {
    $github = 'https://raw.githubusercontent.com/FIDEScommunity/fides-credential-catalog/main/data/aggregated.json';
    $opt    = trim((string) get_option('fides_issuer_catalog_credential_aggregated_url', ''));
    if ($opt !== '') {
        return esc_url_raw($opt);
    }
    if ($use_local) {
        $cred_main = WP_PLUGIN_DIR . '/fides-credential-catalog/fides-credential-catalog.php';
        $cred_json = WP_PLUGIN_DIR . '/fides-credential-catalog/data/aggregated.json';
        if (file_exists($cred_json) && file_exists($cred_main)) {
            return plugins_url('data/aggregated.json', $cred_main);
        }
    }
    return $github;
}

function fides_issuer_catalog_enqueue_assets() {
    $plugin_url = plugin_dir_url(__FILE__);
    $plugin_dir = plugin_dir_path(__FILE__);
    $use_local = fides_issuer_catalog_is_local_site();

    wp_enqueue_style(
        'fides-issuer-catalog',
        $plugin_url . 'assets/style.css',
        [],
        file_exists($plugin_dir . 'assets/style.css') ? filemtime($plugin_dir . 'assets/style.css') : FIDES_ISSUER_CATALOG_VERSION
    );

    wp_enqueue_script(
        'fides-issuer-catalog',
        $plugin_url . 'assets/issuer-catalog.js',
        [],
        file_exists($plugin_dir . 'assets/issuer-catalog.js') ? filemtime($plugin_dir . 'assets/issuer-catalog.js') : FIDES_ISSUER_CATALOG_VERSION,
        true
    );

    $issuer_data_url = $use_local
        ? $plugin_url . 'data/aggregated.json'
        : get_option(
            'fides_issuer_catalog_data_url',
            'https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json'
        );
    $rp_data_url = $use_local
        ? $plugin_url . 'data/rp-aggregated.json'
        : get_option(
            'fides_issuer_catalog_rp_catalog_data_url',
            'https://raw.githubusercontent.com/FIDEScommunity/fides-rp-catalog/main/wordpress-plugin/fides-rp-catalog/data/aggregated.json'
        );

    wp_localize_script('fides-issuer-catalog', 'fidesIssuerCatalog', [
        'pluginUrl'       => $plugin_url,
        'githubDataUrl'   => $issuer_data_url,
        'credentialCatalogUrl' => get_option(
            'fides_issuer_catalog_credential_catalog_url',
            'https://fides.community/community-tools/credential-catalog/'
        ),
        'rpCatalogDataUrl' => $rp_data_url,
        'rpCatalogFallbackUrl' => $plugin_url . 'data/rp-aggregated.json',
        'rpCatalogUrl' => get_option(
            'fides_issuer_catalog_rp_catalog_url',
            'https://fides.community/ecosystem-explorer/relying-party-catalog/'
        ),
        'walletCatalogUrl' => $use_local
            ? 'http://' . $_SERVER['HTTP_HOST'] . '/community-tools/personal-wallets/'
            : get_option(
                'fides_issuer_catalog_wallet_catalog_url',
                'https://fides.community/community-tools/personal-wallets/'
            ),
        'organizationCatalogUrl' => $use_local
            ? rtrim(get_site_url(), '/') . '/organizations/'
            : get_option(
                'fides_issuer_catalog_organization_catalog_url',
                'https://fides.community/ecosystem-explorer/organization-catalog/'
            ),
        'organizationDataUrl' => fides_issuer_catalog_resolve_organization_data_url($use_local),
        'credentialAggregatedDataUrl' => fides_issuer_catalog_resolve_credential_aggregated_url($use_local),
        'vocabularyUrl'         => 'https://raw.githubusercontent.com/FIDEScommunity/fides-interop-profiles/main/data/vocabulary.json',
        'vocabularyFallbackUrl' => $plugin_url . 'assets/vocabulary.json',
    ]);
}
add_action('wp_enqueue_scripts', 'fides_issuer_catalog_enqueue_assets');

/**
 * Register catalog deep-link query vars (helps SEO plugins and canonical URL handling).
 *
 * @param string[] $vars Public query variables.
 * @return string[]
 */
function fides_issuer_catalog_query_vars($vars) {
    foreach (['theme', 'issuer', 'issuers', 'sector', 'country'] as $q) {
        $vars[] = $q;
    }
    return $vars;
}
add_filter('query_vars', 'fides_issuer_catalog_query_vars');

/**
 * Avoid redirect_canonical dropping FIDES issuer catalog deep-link parameters (empty search in JS).
 *
 * @param string|false $redirect_url Computed canonical URL, or false.
 * @return string|false
 */
function fides_issuer_catalog_preserve_redirect_canonical($redirect_url) {
    $keys = ['theme', 'issuer', 'issuers', 'sector', 'country'];
    foreach ($keys as $key) {
        if (isset($_GET[$key]) && (string) $_GET[$key] !== '') {
            return false;
        }
    }
    return $redirect_url;
}
add_filter('redirect_canonical', 'fides_issuer_catalog_preserve_redirect_canonical', 10, 1);

function fides_issuer_catalog_shortcode($atts) {
    $atts = shortcode_atts([
        'show_filters'     => 'true',
        'show_search'      => 'true',
        'columns'          => '3',
        'theme'            => 'fides',
        'taxonomy_theme' => '',
    ], $atts);

    $show_filters = $atts['show_filters'] === 'true' ? 'true' : 'false';
    $show_search  = $atts['show_search']  === 'true' ? 'true' : 'false';
    $columns      = in_array($atts['columns'], ['2', '3', '4']) ? $atts['columns'] : '3';
    $theme        = in_array($atts['theme'], ['dark', 'light', 'fides']) ? $atts['theme'] : 'fides';
    $taxonomy_theme = sanitize_text_field((string) $atts['taxonomy_theme']);

    // Build the initial HTML inside the root container. When the master
    // SSR switch is on, this returns a hidden SSR fallback (visible to
    // crawlers + no-JS visitors via <noscript>) plus the visible loading
    // spinner that JS users see until issuer-catalog.js mounts.
    $initial_html = '';
    if (class_exists('Fides_Issuer_Catalog_SSR')) {
        $initial_html = Fides_Issuer_Catalog_SSR::build_initial_html(array(
            'show_filters'   => $show_filters,
            'show_search'    => $show_search,
            'columns'        => $columns,
            'theme'          => $theme,
            'taxonomy_theme' => $taxonomy_theme,
        ));
    }
    if ($initial_html === '') {
        $initial_html = '<p style="padding:2rem;opacity:.6;">Loading issuer catalog…</p>';
    }

    return sprintf(
        '<div id="fides-issuer-catalog-root" class="fides-issuer-catalog" data-show-filters="%s" data-show-search="%s" data-columns="%s" data-theme="%s" data-taxonomy-theme="%s">%s</div>',
        esc_attr($show_filters),
        esc_attr($show_search),
        esc_attr($columns),
        esc_attr($theme),
        esc_attr($taxonomy_theme),
        $initial_html
    );
}
add_shortcode('fides_issuer_catalog', 'fides_issuer_catalog_shortcode');

// Settings page
function fides_issuer_catalog_settings_init() {
    register_setting('fides_issuer_catalog_settings', 'fides_issuer_catalog_data_url', [
        'type' => 'string', 'sanitize_callback' => 'esc_url_raw',
    ]);
    register_setting('fides_issuer_catalog_settings', 'fides_issuer_catalog_credential_catalog_url', [
        'type' => 'string', 'sanitize_callback' => 'esc_url_raw',
    ]);
    register_setting('fides_issuer_catalog_settings', 'fides_issuer_catalog_rp_catalog_data_url', [
        'type' => 'string', 'sanitize_callback' => 'esc_url_raw',
    ]);
    register_setting('fides_issuer_catalog_settings', 'fides_issuer_catalog_rp_catalog_url', [
        'type' => 'string', 'sanitize_callback' => 'esc_url_raw',
    ]);
    register_setting('fides_issuer_catalog_settings', 'fides_issuer_catalog_organization_catalog_url', [
        'type' => 'string', 'sanitize_callback' => 'esc_url_raw',
    ]);
    register_setting('fides_issuer_catalog_settings', 'fides_issuer_catalog_organization_data_url', [
        'type' => 'string', 'sanitize_callback' => 'esc_url_raw',
    ]);
    register_setting('fides_issuer_catalog_settings', 'fides_issuer_catalog_credential_aggregated_url', [
        'type' => 'string', 'sanitize_callback' => 'esc_url_raw',
    ]);
}
add_action('admin_init', 'fides_issuer_catalog_settings_init');

function fides_issuer_catalog_settings_page() {
    add_options_page(
        'FIDES Issuer Catalog',
        'FIDES Issuer Catalog',
        'manage_options',
        'fides-issuer-catalog',
        'fides_issuer_catalog_settings_render'
    );
}
add_action('admin_menu', 'fides_issuer_catalog_settings_page');

function fides_issuer_catalog_settings_render() { ?>
    <div class="wrap">
        <h1>FIDES Issuer Catalog Settings</h1>
        <form method="post" action="options.php">
            <?php settings_fields('fides_issuer_catalog_settings'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="fides_issuer_catalog_data_url">Aggregated Data URL</label></th>
                    <td>
                        <input type="url" id="fides_issuer_catalog_data_url" name="fides_issuer_catalog_data_url"
                               value="<?php echo esc_attr(get_option('fides_issuer_catalog_data_url', 'https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json')); ?>"
                               class="regular-text">
                        <p class="description">URL to the issuer catalog aggregated.json.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="fides_issuer_catalog_credential_catalog_url">Credential Catalog Base URL</label></th>
                    <td>
                        <input type="url" id="fides_issuer_catalog_credential_catalog_url" name="fides_issuer_catalog_credential_catalog_url"
                               value="<?php echo esc_attr(get_option('fides_issuer_catalog_credential_catalog_url', 'https://fides.community/community-tools/credential-catalog/')); ?>"
                               class="regular-text">
                        <p class="description">Base URL for credential catalog deep links in the modal.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="fides_issuer_catalog_rp_catalog_url">RP Catalog Base URL</label></th>
                    <td>
                        <input type="url" id="fides_issuer_catalog_rp_catalog_url" name="fides_issuer_catalog_rp_catalog_url"
                               value="<?php echo esc_attr(get_option('fides_issuer_catalog_rp_catalog_url', 'https://fides.community/ecosystem-explorer/relying-party-catalog/')); ?>"
                               class="regular-text">
                        <p class="description">Base URL for relying party catalog links (e.g. “Open in catalog” and RP names in the issuer modal).</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="fides_issuer_catalog_rp_catalog_data_url">RP Catalog Data URL</label></th>
                    <td>
                        <input type="url" id="fides_issuer_catalog_rp_catalog_data_url" name="fides_issuer_catalog_rp_catalog_data_url"
                               value="<?php echo esc_attr(get_option('fides_issuer_catalog_rp_catalog_data_url', 'https://raw.githubusercontent.com/FIDEScommunity/fides-rp-catalog/main/data/aggregated.json')); ?>"
                               class="regular-text">
                        <p class="description">URL to the RP catalog aggregated.json (used to count relying parties per issuer).</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="fides_issuer_catalog_organization_catalog_url">Organization Catalog Base URL</label></th>
                    <td>
                        <input type="url" id="fides_issuer_catalog_organization_catalog_url" name="fides_issuer_catalog_organization_catalog_url"
                               value="<?php echo esc_attr(get_option('fides_issuer_catalog_organization_catalog_url', 'https://fides.community/ecosystem-explorer/organization-catalog/')); ?>"
                               class="regular-text">
                        <p class="description">Base URL for organization deep links in the issuer modal (query <code>?org=</code> is appended). On local <code>.local</code> / <code>localhost</code> sites this setting is ignored; the plugin uses <code>/organizations/</code> on the same site instead.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="fides_issuer_catalog_organization_data_url">Organization catalog data URL</label></th>
                    <td>
                        <input type="url" id="fides_issuer_catalog_organization_data_url" name="fides_issuer_catalog_organization_data_url"
                               value="<?php echo esc_attr(get_option('fides_issuer_catalog_organization_data_url', '')); ?>"
                               class="regular-text" placeholder="<?php echo esc_attr('https://raw.githubusercontent.com/.../aggregated.json'); ?>">
                        <p class="description">Optional. JSON used for sector and <strong>country</strong> filters (issuer authority country from the organization catalog). Leave empty to use the GitHub default, or on local sites the <code>fides-organization-catalog</code> plugin <code>data/aggregated.json</code> when that plugin is installed.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="fides_issuer_catalog_credential_aggregated_url">Credential catalog data URL</label></th>
                    <td>
                        <input type="url" id="fides_issuer_catalog_credential_aggregated_url" name="fides_issuer_catalog_credential_aggregated_url"
                               value="<?php echo esc_attr(get_option('fides_issuer_catalog_credential_aggregated_url', '')); ?>"
                               class="regular-text" placeholder="<?php echo esc_attr('https://raw.githubusercontent.com/.../aggregated.json'); ?>">
                        <p class="description">Optional. Credential catalog <code>aggregated.json</code> used for the <strong>Theme</strong> filter and <code>?theme=</code> deep links. Leave empty for GitHub default or bundled credential plugin JSON on local sites.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        <h2>Shortcode</h2>
        <p><code>[fides_issuer_catalog]</code></p>
        <p>Optional attributes: <code>show_filters</code>, <code>show_search</code>, <code>columns</code>, <code>theme</code> (UI color), <code>taxonomy_theme</code> (preset taxonomy filter).</p>
    </div>
<?php }
