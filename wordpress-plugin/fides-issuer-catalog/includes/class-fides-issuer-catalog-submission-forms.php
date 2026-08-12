<?php
/**
 * Public issuer create and update forms.
 *
 * @package fides-issuer-catalog
 */

if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Fides_Issuer_Catalog_Submission_Forms')) {
    class Fides_Issuer_Catalog_Submission_Forms {
        const VERSION = '1.7.11';

        public static function bootstrap(): void {
            add_action('wp_enqueue_scripts', array(__CLASS__, 'register_assets'));
            add_shortcode('fides_issuer_submit_form', array(__CLASS__, 'render_submit_shortcode'));
            add_shortcode('fides_issuer_update_form', array(__CLASS__, 'render_update_shortcode'));
        }

        public static function register_assets(): void {
            $base = plugin_dir_path(dirname(__FILE__));
            $url  = plugin_dir_url(dirname(__FILE__));
            $css  = $base . 'assets/issuer-form.css';
            $js   = $base . 'assets/issuer-form.js';
            wp_register_style('fides-issuer-form', $url . 'assets/issuer-form.css', array(), file_exists($css) ? (string) filemtime($css) : self::VERSION);
            wp_register_script('fides-issuer-form', $url . 'assets/issuer-form.js', array(), file_exists($js) ? (string) filemtime($js) : self::VERSION, true);
        }

        public static function render_submit_shortcode($atts = array()): string {
            unset($atts);
            return self::render_form('create');
        }

        public static function render_update_shortcode($atts = array()): string {
            $atts = shortcode_atts(array('issuer' => ''), $atts, 'fides_issuer_update_form');
            $issuer = self::normalize_issuer_id((string) $atts['issuer']);
            if ($issuer === '' && isset($_GET['issuer'])) {
                // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                $issuer = self::normalize_issuer_id((string) wp_unslash($_GET['issuer']));
            }
            return self::render_form('update', array('preselectIssuerId' => $issuer));
        }

        /**
         * @param string               $mode create|update.
         * @param array<string, mixed> $extra Additional client config.
         */
        private static function render_form($mode, array $extra = array()): string {
            if (! class_exists('Fides_Catalog_Submission_Registry')
                || ! Fides_Catalog_Submission_Registry::exists('issuer')) {
                return '<div class="fides-use-case-card"><p>' . esc_html__(
                    'Issuer submissions are unavailable (missing submission core or adapter).',
                    'fides-issuer-catalog'
                ) . '</p></div>';
            }
            if (! is_user_logged_in()) {
                wp_enqueue_style('fides-issuer-form');
                return sprintf(
                    '<div class="fides-use-case-card"><p>%s</p><p><a class="fides-issuer-form-login-link" href="%s">%s</a></p></div>',
                    esc_html__('You must be signed in to submit issuer catalog changes.', 'fides-issuer-catalog'),
                    esc_url(self::form_login_url()),
                    esc_html__('Sign in to continue', 'fides-issuer-catalog')
                );
            }
            $preselect = (string) ($extra['preselectIssuerId'] ?? '');
            if ($mode === 'update' && $preselect !== '' && class_exists('Fides_Catalog_Org_Tier')) {
                $item = class_exists('Fides_Catalog_Submission_Lookups')
                    ? Fides_Catalog_Submission_Lookups::find_item_by_id('issuer', $preselect)
                    : null;
                if (! Fides_Catalog_Org_Tier::user_can_edit_item(
                    'issuer',
                    $preselect,
                    get_current_user_id(),
                    is_array($item) ? $item : null
                )) {
                    wp_enqueue_style('fides-issuer-form');
                    return '<div class="fides-use-case-card"><p>' . esc_html__(
                        'This issuer can only be updated by a linked organization owner.',
                        'fides-issuer-catalog'
                    ) . '</p></div>';
                }
            }

            wp_enqueue_style('fides-issuer-form');
            wp_enqueue_script('fides-issuer-form');
            $user = wp_get_current_user();
            $config = array_merge(
                array(
                    'mode'              => $mode === 'update' ? 'update' : 'create',
                    'apiBase'           => esc_url_raw(rest_url('fides-catalog/v1')),
                    'restNonce'         => wp_create_nonce('wp_rest'),
                    'contactEmail'      => sanitize_email((string) $user->user_email),
                    'preselectIssuerId' => '',
                    'environments'      => Fides_Issuer_Catalog_Submission_Adapter::ENVIRONMENTS,
                    'protocols'         => Fides_Issuer_Catalog_Submission_Adapter::PROTOCOLS,
                ),
                $extra
            );
            wp_add_inline_script(
                'fides-issuer-form',
                'window.FIDES_ISSUER_FORM_CONFIG = ' . wp_json_encode($config) . ';',
                'before'
            );
            $id = $mode === 'update' ? 'fides-issuer-update-form-root' : 'fides-issuer-submit-form-root';
            return '<div id="' . esc_attr($id) . '" class="fides-issuer-submission-root"></div>';
        }

        public static function form_login_url(): string {
            $uri  = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
            $host = isset($_SERVER['HTTP_HOST']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_HOST'])) : '';
            $current = $host !== '' ? ((is_ssl() ? 'https://' : 'http://') . $host . $uri) : home_url('/');
            $options = get_option('universal_openid4vp_options', array());
            if (is_array($options) && ! empty($options['loginUrl'])) {
                return esc_url_raw(add_query_arg('return_to', $current, (string) $options['loginUrl']));
            }
            return wp_login_url($current);
        }

        private static function normalize_issuer_id($raw): string {
            $id = sanitize_text_field(trim((string) $raw));
            return $id !== '' && preg_match(Fides_Issuer_Catalog_Submission_Adapter::ID_PATTERN, $id) ? $id : '';
        }
    }
}
