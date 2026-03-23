# FIDES Issuer Catalog

**Developed and maintained by FIDES Labs BV**

A community-driven catalog of OID4VCI credential issuers. Organizations contribute a minimal source file with their `.well-known/openid-credential-issuer` URL; the crawler auto-discovers all metadata and links credential configurations to the [FIDES Credential Catalog](https://github.com/FIDEScommunity/fides-credential-catalog).

## 🎯 Concept

1. **Minimal contribution** — Provide only your organization info and `.well-known` URL; the crawler fetches everything else
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
├── src/
│   ├── types/issuer.ts                   # TypeScript type definitions
│   └── crawler/index.ts                  # Crawler: fetches .well-known, enriches data
├── data/
│   ├── aggregated.json                   # Machine-readable output
│   └── issuer-history-state.json         # firstSeenAt persistence
├── docs/
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
```

## ➕ Add Your Issuer

1. **Fork** this repository
2. **Create** `community-catalogs/<your-org>/issuer-catalog.json`
3. **Submit** a Pull Request

### Minimal Example

```json
{
  "$schema": "https://fides.community/schemas/issuer-catalog/v1",
  "organization": {
    "name": "Your Organization",
    "did": "did:web:yourdomain.com",
    "website": "https://yourdomain.com"
  },
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
| `credentialRefs[]` | Manual credential catalog refs (fallback if auto-match fails) |

## 🔍 Machine-Readable Output

```
https://raw.githubusercontent.com/FIDEScommunity/fides-issuer-catalog/main/data/aggregated.json
```

Each issuer entry includes all source fields plus data enriched from `.well-known`:
- `displayName`, `logoUri` — from `display[]`
- `credentialIssuerUrl` — from `credential_issuer`
- `issuerWebsiteUrl` — optional; from source catalog when set (e.g. issuer web UI or playground link)
- `credentialConfigurations[]` — one entry per supported credential, including:
  - `vcFormat`, `vct`, `docType`
  - `signingAlgorithms`, `proofTypes`, `cryptographicBindingMethods`
  - `credentialCatalogRef` — matched entry from the credential catalog

## 🔌 WordPress Integration

```
[fides_issuer_catalog]
```

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
