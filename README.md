# FIDES Issuer Catalog

**Developed and maintained by FIDES Labs BV**

A community-driven catalog of OID4VCI credential issuers. Organizations contribute a minimal source file with their `.well-known/openid-credential-issuer` URL; the crawler auto-discovers all metadata and links credential configurations to the [FIDES Credential Catalog](https://github.com/FIDEScommunity/fides-credential-catalog).

## Changelog

### 1.7.11

- Added create/update Catalog Submissions forms, validation, modal update links,
  and the moderated WordPress-to-GitHub import pipeline.

### 1.7.1

- WordPress plugin version bump to `1.7.1`.
- KPI cards now compute from the currently filtered/search result set.
- The "Used by relying parties" KPI now also follows the filtered issuer subset.
- KPI cards remain informational only (no quick-filter click behavior).

## 🎯 Concept

1. **Minimal contribution** — Reference your [organization catalog](https://github.com/FIDEScommunity/fides-organization-catalog) entry via `orgId` and provide `.well-known` URLs; the crawler resolves name, DID, website, and logo from the org catalog and fetches the rest from OID4VCI metadata
2. **Auto-discovery** — Credential configurations, signing algorithms, proof types, and logos are extracted from your OID4VCI metadata endpoint
3. **Cross-catalog linking** — Credential configurations are automatically matched to credential catalog entries via `vct`/`docType`
4. **Consistent UX** — Identical look & feel to the FIDES Wallet, RP, and Credential catalogs

## 📁 Project Structure

```
fides-issuer-catalog/
├── schemas/
│   └── issuer-catalog.schema.json        # JSON Schema for source files
├── community-catalogs/                    # Source files per organization
│   └── fides/
│       └── issuer-catalog.json
├── api/public/                           # Vercel serverless public API
│   ├── issuer.ts
│   └── api-docs.ts
├── public/                               # Static landing + Swagger UI
│   ├── index.html
│   └── swagger.html
├── vercel.json                           # Vercel build/output + function limits
├── src/
│   ├── types/issuer.ts                   # TypeScript type definitions
│   └── crawler/index.ts                  # Crawler: fetches .well-known, enriches data
├── data/
│   ├── aggregated.json                   # Machine-readable output
│   └── issuer-history-state.json         # firstSeenAt persistence
├── docs/
│   ├── API.md                            # Public HTTP API contract
│   └── DESIGN_DECISIONS.md              # Architecture decisions
├── wordpress-plugin/
│   └── fides-issuer-catalog/
│       ├── fides-issuer-catalog.php
│       └── assets/
│           ├── issuer-catalog.js
│           └── style.css
└── .gitignore
```

## 🚀 Getting Started

```bash
npm install
npm run crawl      # Fetch .well-known endpoints and write aggregated.json
npm run validate   # Validate source files against the JSON Schema
npm run test:import-wp-submissions
```

**Resolving `orgId`:** The crawler loads the [organization catalog](https://github.com/FIDEScommunity/fides-organization-catalog) `data/aggregated.json` from GitHub (raw), or falls back to `../organization-catalog/data/aggregated.json` when the fetch fails. Override with `ORGANIZATION_CATALOG_AGGREGATED_PATH` if needed.

## Public API (Vercel)

The issuer catalog can be deployed as a **read-only API** on Vercel (`api/public/`, `vercel.json`, `public/`). Import this repository in Vercel (root = repo root); build settings follow `vercel.json`.

- `GET /api/public/issuer` — List, search, and filter issuers (see [docs/API.md](docs/API.md))
- `GET /api/public/issuer/{id}` — One issuer by id
- `GET /api/public/api-docs` — OpenAPI 3.1 (JSON)
- `/swagger.html` — Swagger UI

For a single public hostname across catalogs, use the [FIDES API Gateway](https://github.com/FIDEScommunity/fides-api-gateway) and set `FIDES_ISSUER_CATALOG_ORIGIN` to this project’s `*.vercel.app` URL.

## ➕ Add Your Issuer

1. **Fork** this repository
2. **Create** `community-catalogs/<your-org>/issuer-catalog.json`
3. **Submit** a Pull Request

### Minimal Example

Add your organization to the [FIDES Organization Catalog](https://github.com/FIDEScommunity/fides-organization-catalog) first, then reference it by id:

```json
{
  "$schema": "https://fides.community/schemas/issuer-catalog/v1",
  "orgId": "org:yourorg",
  "issuers": [
    {
      "id": "issuer:yourorg:my-issuer:production",
      "environment": "production",
      "oid4vciMetadataUrl": "https://issuer.yourdomain.com/.well-known/openid-credential-issuer"
    }
  ]
}
```

### ID Convention

`issuer:<orgCode>:<issuerKey>:<environment>`

| Segment | Example |
|---------|---------|
| `issuer` | `issuer` |
| `orgCode` | `fides`, `nl`, `animo` |
| `issuerKey` | `lpid-issuer`, `ehic-issuer` |
| `environment` | `production` (live) or `test` (all non-production: pilots, sandboxes, demos, QA). Use `projectContext` for detail. |

### Optional Fields

| Field | Description |
|-------|-------------|
| `displayName` | Override the display name from `.well-known` |
| `projectContext` | Project/pilot context (e.g. `"EWC v3 pilot"`) |
| `supportedWallets[]` | References to wallet catalog IDs |
| `credentialRefs[]` | Manual credential catalog refs. Used when auto-match on `vct` / `doctype` fails, and for extra types on the same issuer (e.g. Linked VP). A catalog `id` is enough; `displayName` is optional. |

## 🔍 Machine-Readable Output

```
https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json
```

Each issuer entry includes `orgId`, resolved `organization` (from the organization catalog), plus data enriched from `.well-known`:
- `displayName`, `logoUri` — from `display[]` (logo may fall back to org catalog)
- `credentialIssuerUrl` — from `credential_issuer`
- `issuerWebsiteUrl` — optional; from source catalog when set (e.g. issuer web UI or playground link)
- `credentialConfigurations[]` — one entry per supported credential, including:
  - `vcFormat`, `vct`, `docType`
  - `signingAlgorithms`, `proofTypes`, `cryptographicBindingMethods`
  - `credentialCatalogRef` — matched entry from the credential catalog

## 🔌 WordPress Integration

```
[fides_issuer_catalog]
[fides_issuer_submit_form]
[fides_issuer_update_form]
```

The submission forms require a logged-in user and the Catalog Submissions core
from `fides-community-tools-tiles`. Create submissions select an organization
and generate the stable issuer id. Update links use `/issuers-update/?issuer=…`
by default; configure a different page in the plugin settings. All schema source
fields are editable without plan-tier restrictions. Published submissions are
merged into `community-catalogs/<org-slug>/issuer-catalog.json` by
`.github/workflows/wp-submissions-sync.yml`, preserving sibling issuers.
The crawler already reads these local source files directly, so this workflow
does not need a separate remote issuer import or skip-remote flag.

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `show_filters` | `true`, `false` | `true` | Show/hide filter sidebar |
| `show_search` | `true`, `false` | `true` | Show/hide search |
| `columns` | `2`, `3`, `4` | `3` | Card columns |
| `theme` | `fides`, `light`, `dark` | `fides` | Color theme |

## 🔗 Related Catalogs

| Catalog | Description |
|---------|-------------|
| [Wallet Catalog](https://github.com/FIDEScommunity/fides-wallet-catalog) | Digital identity wallets |
| [RP Catalog](https://github.com/FIDEScommunity/fides-rp-catalog) | Relying parties |
| [Credential Catalog](https://github.com/FIDEScommunity/fides-credential-catalog) | Credential schemas |

## 📄 License

Apache License 2.0 — © 2026 FIDES Labs BV
