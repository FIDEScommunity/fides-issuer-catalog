# Issuer Catalog API

## Overview

The FIDES Issuer Catalog exposes a read-only serverless API on Vercel over `data/aggregated.json`.

## Endpoints

### `GET /api/public/issuer`

Returns a paginated, filterable list of issuers.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | — | Search across id, orgId, displayName, description, URLs, project context, org name, and credential configuration fields |
| `environment` | string | — | Exact match (e.g. `test`, `production`) |
| `orgId` | string | — | Exact organization catalog id (e.g. `org:animo`) |
| `vcFormat` | string | — | Issuer has at least one configuration with this format (e.g. `sd_jwt_vc`, `mdoc`) |
| `sort` | string | `displayName` | `displayName`, `environment`, `id`, `orgId`, `updatedAt` |
| `direction` | string | `asc` | `asc` or `desc` |
| `page` | integer | `0` | Zero-based page |
| `size` | integer | `20` | Page size |

**Response shape:**

```json
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0,
  "number": 0,
  "size": 20
}
```

### `GET /api/public/api-docs`

OpenAPI 3.1 specification (JSON).

## Deployment

Same pattern as the [Organization Catalog API](https://github.com/FIDEScommunity/fides-organization-catalog): `vercel.json`, `npm ci`, `outputDirectory: public`, functions under `api/**/*.ts`.
