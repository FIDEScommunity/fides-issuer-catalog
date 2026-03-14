<?php
/**
 * Plugin Name: FIDES Issuer Catalog
 * Description: Searchable catalog of OID4VCI credential issuers.
 * Version: 1.0.0
 * Author: FIDES Labs BV
 * License: Apache-2.0
 */

if (!defined('ABSPATH')) exit;

function fides_issuer_catalog_enqueue_assets() {
    $plugin_url = plugin_dir_url(__FILE__);
    $plugin_dir = plugin_dir_path(__FILE__);

    wp_enqueue_style(
        'fides-issuer-catalog',
        $plugin_url . 'assets/style.css',
        [],
        file_exists($plugin_dir . 'assets/style.css') ? filemtime($plugin_dir . 'assets/style.css') : '1.0.0'
    );

    wp_enqueue_script(
        'fides-issuer-catalog',
        $plugin_url . 'assets/issuer-catalog.js',
        [],
        file_exists($plugin_dir . 'assets/issuer-catalog.js') ? filemtime($plugin_dir . 'assets/issuer-catalog.js') : '1.0.0',
        true
    );

    wp_localize_script('fides-issuer-catalog', 'fidesIssuerCatalog', [
        'pluginUrl'       => $plugin_url,
        'githubDataUrl'   => get_option(
            'fides_issuer_catalog_data_url',
            'https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json'
        ),
        'credentialCatalogUrl' => get_option(
            'fides_issuer_catalog_credential_catalog_url',
            'https://fides.community/community-tools/credential-catalog/'
        ),
        'rpCatalogDataUrl' => get_option(
            'fides_issuer_catalog_rp_catalog_data_url',
            'https://raw.githubusercontent.com/FIDEScommunity/fides-rp-catalog/main/wordpress-plugin/fides-rp-catalog/data/aggregated.json'
        ),
        'rpCatalogFallbackUrl' => $plugin_url . 'data/rp-aggregated.json',
        'vocabularyUrl'         => 'https://raw.githubusercontent.com/FIDEScommunity/fides-interop-profiles/main/data/vocabulary.json',
        'vocabularyFallbackUrl' => $plugin_url . 'assets/vocabulary.json',
    ]);
}
add_action('wp_enqueue_scripts', 'fides_issuer_catalog_enqueue_assets');

function fides_issuer_catalog_shortcode($atts) {
    $atts = shortcode_atts([
        'show_filters' => 'true',
        'show_search'  => 'true',
        'columns'      => '3',
        'theme'        => 'fides',
    ], $atts);

    $show_filters = $atts['show_filters'] === 'true' ? 'true' : 'false';
    $show_search  = $atts['show_search']  === 'true' ? 'true' : 'false';
    $columns      = in_array($atts['columns'], ['2', '3', '4']) ? $atts['columns'] : '3';
    $theme        = in_array($atts['theme'], ['dark', 'light', 'fides']) ? $atts['theme'] : 'fides';

    return sprintf(
        '<div id="fides-issuer-catalog-root" class="fides-issuer-catalog" data-show-filters="%s" data-show-search="%s" data-columns="%s" data-theme="%s"><p style="padding:2rem;opacity:.6;">Loading issuer catalog…</p></div>',
        esc_attr($show_filters),
        esc_attr($show_search),
        esc_attr($columns),
        esc_attr($theme)
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
                    <th scope="row"><label for="fides_issuer_catalog_rp_catalog_data_url">RP Catalog Data URL</label></th>
                    <td>
                        <input type="url" id="fides_issuer_catalog_rp_catalog_data_url" name="fides_issuer_catalog_rp_catalog_data_url"
                               value="<?php echo esc_attr(get_option('fides_issuer_catalog_rp_catalog_data_url', 'https://raw.githubusercontent.com/FIDEScommunity/fides-rp-catalog/main/data/aggregated.json')); ?>"
                               class="regular-text">
                        <p class="description">URL to the RP catalog aggregated.json (used to count relying parties per issuer).</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        <h2>Shortcode</h2>
        <p><code>[fides_issuer_catalog]</code></p>
        <p>Optional attributes: <code>show_filters</code>, <code>show_search</code>, <code>columns</code>, <code>theme</code>.</p>
    </div>
<?php }
