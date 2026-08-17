=== FIDES Issuer Catalog ===
Contributors: fideslabs
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.8.3
License: Apache-2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0

OID4VCI issuer catalog with search, filters, and optional SSR/SEO via fides-community-tools-tiles.

== Changelog ==

= 1.8.3 =
* Skip empty GitHub aggregated.json payloads and fall through to the bundled plugin snapshot / WP last-known-good.

= 1.8.2 =
* After GitHub fails, use a 12-hour browser cache and the WP last-known-good aggregated feed before the bundled plugin snapshot.

= 1.8.1 =
* Show a dismissible notice when GitHub catalog data is unreachable and the plugin snapshot is used.

= 1.8.0 =
* Add an “or Ask FIDES” button beside issuer search when FIDES Assistant 0.6.1
  or newer is active.
* Reuse the headless assistant modal, prefill the current search without
  submitting it, and show an issuer-specific chat placeholder.

= 1.7.12 =
* Issuer modal: Use cases accordion when use cases link this issuer (after intro, above Ecosystem Model); same-window deep links and like counts.
* Settings: use case catalog page URL and aggregated.json URL for reverse-linking.

= 1.7.11 =
* Add logged-in create and update forms for issuer catalog submissions.
* Add issuer schema validation, lookup prefill, source-only export, and GitHub publication mapping.
* Add a configurable issuer update form URL and logged-in modal edit link without plan-tier restrictions.

= 1.7.10 =
* Mobile filters: keep the drawer open when expanding groups or selecting options; keep body scroll lock in sync (shared FidesCatalogUI.createMobileFiltersController from tiles ≥ 1.8.28).

= 1.7.9 =
* Issuer detail modal: restore subtle Last updated footer; dates use the browser locale (bundled fides-catalog-ui from tiles ≥ 1.8.20).

= 1.7.8 =
* Ecosystem model modal section: add Explain link to the FIDES Ecosystem Explorer (same as RP catalog).

= 1.7.7 =
* Mobile detail modal layout via updated bundled `assets/lib/fides-catalog-ui.*` (sync from fides-community-tools-tiles ≥ 1.7.8).
