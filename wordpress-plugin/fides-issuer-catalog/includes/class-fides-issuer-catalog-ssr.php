<?php
/**
 * Issuer Catalog SSR — issuer-specific subclass of the shared
 * Fides_Catalog_SSR_Renderer base class shipped by fides-community-tools-tiles.
 *
 * Catalog-specific responsibilities living here:
 *   - Register the 'issuer' catalog type in Fides_Catalog_Registry, with the
 *     correct field-name overrides for the issuer aggregated.json shape
 *     (`displayName`, `logoUri`, `organization`, `description`).
 *   - Override the listing page URL (single landing page for all issuers) so
 *     the CollectionPage JSON-LD points to the right canonical URL.
 *   - Build dl meta rows + chip sections for the SSR detail block (environment,
 *     credentials offered, authority country, supported wallets, …).
 *   - Enrich the Organization JSON-LD with issuer specifics (DID, metadata
 *     URL, supported wallets as `knowsAbout`, etc.).
 *
 * Everything stays gated on fides_catalog_ssr_enabled(); flipping the master
 * switch off in /wp-admin/options-general.php?page=fides-catalog-seo
 * instantly returns the plugin to legacy JS-only behaviour.
 *
 * Backwards compat: when the shared base class isn't loaded (e.g. tiles plugin
 * disabled), this class becomes a no-op shim with the same public surface so
 * the main plugin file does not need conditional checks.
 *
 * @package fides-issuer-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Issuer_Catalog_SSR')) {

    if (! class_exists('Fides_Catalog_SSR_Renderer')) {

        class Fides_Issuer_Catalog_SSR {
            const TYPE                = 'issuer';
            const DEFAULT_CATALOG_PATH = '/ecosystem-explorer/issuer-catalog/';
            const OPTION_CATALOG_URL   = 'fides_issuer_catalog_page_url';
            const MAX_LISTING_ITEMS    = 30;
            public static function bootstrap() { /* no-op without base */ }
            public static function build_initial_html(array $atts) { return ''; }
        }

    } else {

        class Fides_Issuer_Catalog_SSR extends Fides_Catalog_SSR_Renderer {

            const TYPE                 = 'issuer';
            const DEFAULT_CATALOG_PATH = '/ecosystem-explorer/issuer-catalog/';
            const OPTION_CATALOG_URL   = 'fides_issuer_catalog_page_url';
            const MAX_LISTING_ITEMS    = 30;

            /** @var self|null */
            private static $instance = null;

            /* --------------------------------------------------------------
             * Static facade preserved for the main plugin file.
             * -------------------------------------------------------------- */

            public static function bootstrap(): void {
                if (self::$instance === null) {
                    self::$instance = new self();
                    self::$instance->bootstrap_renderer();
                    add_action('admin_init', array(__CLASS__, 'register_settings'));
                }
            }

            public static function build_initial_html(array $atts): string {
                self::bootstrap();
                return self::$instance->render_initial_html($atts);
            }

            /* --------------------------------------------------------------
             * Required overrides
             * -------------------------------------------------------------- */

            protected function type(): string             { return self::TYPE; }
            protected function text_domain(): string      { return 'fides-issuer-catalog'; }
            protected function shortcode_root_id(): string { return 'fides-issuer-catalog-root'; }
            protected function loading_label(): string    { return __('Loading issuer catalog…', 'fides-issuer-catalog'); }
            protected function max_listing_items(): int   { return self::MAX_LISTING_ITEMS; }

            public function register_with_core(): void {
                if (! class_exists('Fides_Catalog_Registry')) {
                    return;
                }
                Fides_Catalog_Registry::register(self::TYPE, array(
                    'label'             => __('Issuers', 'fides-issuer-catalog'),
                    'json_url'          => 'https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json',
                    'collection_key'    => 'issuers',
                    'id_field'          => 'id',
                    'name_field'        => 'displayName',
                    'description_field' => 'description',
                    'logo_field'        => 'logoUri',
                    'detail_param'      => 'issuer',
                    'pages'             => array(
                        'main' => self::catalog_path(),
                    ),
                    'jsonld_type'       => 'Organization',
                ));
            }

            /* --------------------------------------------------------------
             * Settings (admin path for the issuer landing page)
             * -------------------------------------------------------------- */

            public static function register_settings(): void {
                register_setting('fides_issuer_catalog_settings', self::OPTION_CATALOG_URL, array(
                    'type'              => 'string',
                    'default'           => self::DEFAULT_CATALOG_PATH,
                    'sanitize_callback' => array(__CLASS__, 'sanitize_path'),
                ));
            }

            public static function sanitize_path($value): string {
                $value = is_string($value) ? trim($value) : '';
                if ($value === '') {
                    return '';
                }
                $path = wp_parse_url($value, PHP_URL_PATH);
                if (! is_string($path) || $path === '') {
                    return '';
                }
                if ($path[0] !== '/') {
                    $path = '/' . $path;
                }
                return user_trailingslashit($path);
            }

            /* --------------------------------------------------------------
             * Listing page name + URL for CollectionPage JSON-LD
             * -------------------------------------------------------------- */

            protected function listing_page_name(string $page_slug): string {
                return __('Issuer Catalog', 'fides-issuer-catalog');
            }

            protected function listing_page_url(string $page_slug): string {
                return home_url(self::catalog_path());
            }

            /* --------------------------------------------------------------
             * JSON-LD enrichment for the Organization payload
             * -------------------------------------------------------------- */

            protected function enrich_jsonld(array $jsonld, array $item): array {
                $org = (isset($item['organization']) && is_array($item['organization'])) ? $item['organization'] : array();

                if (! empty($org['name']) && empty($jsonld['legalName'])) {
                    $jsonld['legalName'] = (string) $org['name'];
                }
                if (! empty($org['website'])) {
                    $jsonld['url'] = (string) $org['website'];
                }
                if (! empty($org['did'])) {
                    $jsonld['identifier'] = (string) $org['did'];
                }

                if (! empty($item['issuerWebsiteUrl']) && empty($jsonld['url'])) {
                    $jsonld['url'] = (string) $item['issuerWebsiteUrl'];
                }

                if (! empty($item['logoUri'])) {
                    $jsonld['logo'] = (string) $item['logoUri'];
                }

                if (! empty($item['credentialIssuerUrl'])) {
                    $jsonld['sameAs'] = isset($jsonld['sameAs']) ? (array) $jsonld['sameAs'] : array();
                    $jsonld['sameAs'][] = (string) $item['credentialIssuerUrl'];
                    $jsonld['sameAs']   = array_values(array_unique($jsonld['sameAs']));
                }

                if (! empty($item['environment'])) {
                    $jsonld['additionalType'] = 'IssuerEnvironment:' . (string) $item['environment'];
                }

                $credential_names = self::credential_display_names($item);
                if (! empty($credential_names)) {
                    $jsonld['knowsAbout'] = $credential_names;
                }

                $supported_wallets = self::supported_wallet_names($item);
                if (! empty($supported_wallets)) {
                    $jsonld['memberOf'] = $supported_wallets;
                }

                if (! empty($item['updatedAt']) && is_string($item['updatedAt'])) {
                    $ts = strtotime($item['updatedAt']);
                    if ($ts) {
                        $jsonld['dateModified'] = gmdate('Y-m-d', $ts);
                    }
                }

                return $jsonld;
            }

            /* --------------------------------------------------------------
             * Detail block content (meta rows + chip sections)
             * -------------------------------------------------------------- */

            protected function detail_meta_rows(array $item): array {
                $rows        = array();
                $org         = (isset($item['organization']) && is_array($item['organization'])) ? $item['organization'] : array();
                $environment = isset($item['environment']) ? (string) $item['environment'] : '';
                $issuer_url  = isset($item['issuerWebsiteUrl']) ? trim((string) $item['issuerWebsiteUrl']) : '';
                $org_website = isset($org['website']) ? trim((string) $org['website']) : '';
                $org_did     = isset($org['did']) ? trim((string) $org['did']) : '';
                $project     = isset($item['projectContext']) ? trim((string) $item['projectContext']) : '';
                $updated_at  = isset($item['updatedAt']) && is_string($item['updatedAt']) ? $item['updatedAt'] : '';

                if (! empty($org['name'])) {
                    $rows[] = array(
                        'label' => __('Organization', 'fides-issuer-catalog'),
                        'html'  => esc_html((string) $org['name']),
                    );
                }
                if ($environment !== '') {
                    $rows[] = array(
                        'label' => __('Environment', 'fides-issuer-catalog'),
                        'html'  => esc_html(ucfirst($environment)),
                    );
                }
                if ($project !== '') {
                    $rows[] = array(
                        'label' => __('Project context', 'fides-issuer-catalog'),
                        'html'  => esc_html($project),
                    );
                }
                if ($org_did !== '') {
                    $rows[] = array(
                        'label' => __('DID', 'fides-issuer-catalog'),
                        'html'  => '<code>' . esc_html($org_did) . '</code>',
                    );
                }
                if ($org_website !== '') {
                    $rows[] = array(
                        'label' => __('Organization website', 'fides-issuer-catalog'),
                        'html'  => sprintf(
                            '<a href="%1$s" rel="nofollow noopener" target="_blank">%2$s</a>',
                            esc_url($org_website),
                            esc_html($org_website)
                        ),
                    );
                }
                if ($issuer_url !== '') {
                    $rows[] = array(
                        'label' => __('Issuer website', 'fides-issuer-catalog'),
                        'html'  => sprintf(
                            '<a href="%1$s" rel="nofollow noopener" target="_blank">%2$s</a>',
                            esc_url($issuer_url),
                            esc_html($issuer_url)
                        ),
                    );
                }
                if ($updated_at !== '') {
                    $ts = strtotime($updated_at);
                    if ($ts) {
                        $rows[] = array(
                            'label' => __('Last updated', 'fides-issuer-catalog'),
                            'html'  => sprintf(
                                '<time datetime="%1$s">%1$s</time>',
                                esc_attr(gmdate('Y-m-d', $ts))
                            ),
                        );
                    }
                }
                return $rows;
            }

            protected function detail_extra_sections(array $item): string {
                $td = 'fides-issuer-catalog';
                $credentials = self::credential_display_names($item);
                $wallets     = self::supported_wallet_names($item);

                ob_start();
                echo $this->render_chip_section($credentials, __('Credentials offered', $td));
                echo $this->render_chip_section($wallets,     __('Supported wallets', $td));
                return (string) ob_get_clean();
            }

            /* --------------------------------------------------------------
             * Helpers
             * -------------------------------------------------------------- */

            private static function credential_display_names(array $item): array {
                if (empty($item['credentialConfigurations']) || ! is_array($item['credentialConfigurations'])) {
                    return array();
                }
                $names = array();
                foreach ($item['credentialConfigurations'] as $cfg) {
                    if (! is_array($cfg)) {
                        continue;
                    }
                    if (! empty($cfg['displayName']) && is_string($cfg['displayName'])) {
                        $names[] = trim($cfg['displayName']);
                    } elseif (! empty($cfg['configurationId']) && is_string($cfg['configurationId'])) {
                        $names[] = trim($cfg['configurationId']);
                    }
                }
                return array_values(array_unique(array_filter($names, 'strlen')));
            }

            private static function supported_wallet_names(array $item): array {
                if (empty($item['supportedWallets']) || ! is_array($item['supportedWallets'])) {
                    return array();
                }
                $names = array();
                foreach ($item['supportedWallets'] as $wallet) {
                    if (is_string($wallet)) {
                        $names[] = trim($wallet);
                    } elseif (is_array($wallet)) {
                        if (! empty($wallet['name']) && is_string($wallet['name'])) {
                            $names[] = trim($wallet['name']);
                        } elseif (! empty($wallet['walletCatalogId']) && is_string($wallet['walletCatalogId'])) {
                            $names[] = trim($wallet['walletCatalogId']);
                        }
                    }
                }
                return array_values(array_unique(array_filter($names, 'strlen')));
            }

            private static function catalog_path(): string {
                $opt = (string) get_option(self::OPTION_CATALOG_URL, '');
                return $opt !== '' ? $opt : self::DEFAULT_CATALOG_PATH;
            }
        }
    }
}
