# Design Decisions — FIDES Issuer Catalog

## Overview

This document captures architectural and design decisions made during the development of the FIDES Issuer Catalog. It serves as institutional memory for future contributors and maintainers.

---

## D1 — Repository structure mirrors credential catalog

**Decision:** The issuer catalog uses the same repository layout as the wallet, RP, and credential catalogs:
`community-catalogs/`, `schemas/`, `src/crawler/`, `data/`, `wordpress-plugin/`, `docs/`.

**Rationale:** Consistency across catalogs reduces onboarding friction. Tooling, CI patterns, and contribution workflows are directly reusable.

---

## D2 — Two levels per organization: Organization → Issuers (1:n)

**Decision:** One source file per organization (`community-catalogs/<org>/issuer-catalog.json`), containing an `organization` block and an `issuers[]` array. Each issuer represents one OID4VCI endpoint (e.g. production, test).

**Rationale:** An organization may run multiple issuers (different environments, different credential sets). Grouping them under one organization file avoids duplication of organizational metadata and mirrors how the wallet catalog handles providers.

---

## D3 — Minimal source file: only oid4vciMetadataUrl required per issuer

**Decision:** Contributors provide only:
- `organization.name`, `organization.did`, `organization.website`
- Per issuer: `id`, `environment`, `oid4vciMetadataUrl`

Everything else (display name, logo, credential configurations, signing algorithms, proof types) is auto-discovered by the crawler from the `.well-known/openid-credential-issuer` endpoint.

**Rationale:** Minimizes contributor burden. The OID4VCI spec mandates the `.well-known` endpoint, so all metadata is always available there. Manual duplication in the source file would cause drift.

---

## D4 — ID convention: issuer:<orgCode>:<issuerKey>:<environment>

**Decision:** Issuer IDs follow the pattern `issuer:<orgCode>:<issuerKey>:<environment>`.

Examples:
- `issuer:fides:lpid-issuer:production`
- `issuer:fides:bri-issuer:test`

**Rationale:** Including environment in the ID makes each issuer instance independently addressable. The same issuer key can exist in multiple environments without ID collision. Consistent with the credential catalog's `cred:<authorityCode>:<credentialKey>:<formatCode>` convention.

---

## D5 — Credential catalog linking via vct/docType matching

**Decision:** The crawler matches issuer credential configurations to credential catalog entries by comparing the OID4VCI `vct` (SD-JWT VC) or `doctype` (mdoc) field against the `nativeIdentifier` in `data/aggregated.json` of the credential catalog.

**Rationale:** `nativeIdentifier` in the credential catalog is exactly the stable type identifier used in OID4VCI metadata. This makes matching deterministic and automatic. Manual `credentialCatalogId` can be provided in the source file as a fallback when automatic matching fails.

---

## D12 — Credential catalog aggregated.json: GitHub primary, local fallback on .local

**Decision:** The issuer catalog crawler always fetches `data/aggregated.json` from the credential catalog's GitHub raw URL. It falls back to the sibling local path (`../credential-catalog/data/aggregated.json`) only when GitHub is unreachable. Exception: when the machine hostname ends in `.local` or equals `localhost`, the crawler uses the local file first — this signals a local development environment (e.g. Local by Flywheel / MAMP) where unpublished credential catalog changes (such as new mDoc entries) must be reflected immediately.

This mirrors the logic in the WordPress plugins: the PHP plugins serve local bundled data when the site URL host ends in `.local` or is `localhost`, and serve the GitHub URL otherwise.

**Rationale:**
- On CI and production the credential catalog is always read from GitHub, so no local state is needed and no code changes are required before deployment.
- On a local WordPress dev environment (`.local` hostname) the developer may have unpublished credential catalog changes. Using the local file ensures the issuer catalog crawler picks up those changes without needing a GitHub push first.
- The check is implicit (hostname-based) so no environment variables or script variants are needed — `npm run crawl` works the same everywhere.

---

## D6 — Wallet catalog UX copied literally

**Decision:** The WordPress plugin UI (search, filters, KPI cards, mobile drawer, modal structure, toast notifications, share link) is a literal copy of the wallet catalog's UX patterns.

**Rationale:** Users of the FIDES ecosystem navigate between multiple catalogs. Identical UX reduces cognitive load and ensures a cohesive platform experience. Deviations are only made where the issuer domain requires different fields/terminology.

---

## D7 — GitHub Actions on-push (not scheduled)

**Decision:** The crawler runs on every push that touches `community-catalogs/**` or `data/**`, not on a schedule.

**Rationale:** Issuer metadata changes only when someone pushes to the repository. Unlike wallet catalogs (where external data may change), the issuer catalog data is self-contained in the repo. On-push triggers are more efficient and immediately reflect contributions.

---

## D8 — aggregated.json is the machine-readable API

**Decision:** `data/aggregated.json` is the primary machine-readable endpoint. The raw GitHub URL is used by the WordPress plugin and any consumers.

**Rationale:** Consistent with wallet, RP, and credential catalogs. No separate API server needed for v1.

---

## D9 — OID4VCI only for v1; DIDComm extensible

**Decision:** v1 supports only OID4VCI issuers (those exposing a `.well-known/openid-credential-issuer` endpoint). DIDComm issuers are a planned v2 extension.

**Rationale:** OID4VCI is the dominant protocol in the FIDES ecosystem. The schema is designed to be extensible: adding a `didcommMetadataUrl` or `issuanceProtocols[]` field in a future version requires no breaking changes.

---

## D10 — Organization uses name/did/website in v1; own org IDs planned for v2

**Decision:** Organizations are identified by `name`, `did`, and `website` in v1. No separate `org:…` catalog ID is assigned.

**Rationale:** Introducing cross-catalog organization IDs requires a shared organization registry, which is out of scope for v1. The `did` field provides a globally unique, verifiable identifier that can serve as the basis for a future organization ID scheme.

---

## D11 — firstSeenAt persisted in history state file

**Decision:** `data/issuer-history-state.json` stores the first time each issuer was seen. The crawler never overwrites this value.

**Rationale:** Consistent with wallet and credential catalog patterns. Enables the "Added last 30 days" quick filter to work reliably across crawler runs.

---

## D13 — English only: code, comments, and UI strings

**Decision:** All code comments, UI strings (labels, placeholders, buttons, messages, error text), and in-repository documentation (README, design decisions, schema descriptions) are written in English. Dutch or any other language is not used in code or UI.

**Rationale:** The FIDES catalog platform is an open-source, internationally oriented project. Using English as the single working language ensures:
- Contributors from outside the Netherlands can read and review code without a language barrier.
- UI is immediately usable for non-Dutch-speaking users without translation.
- Tools such as linters, AI assistants, and code review bots work better with English source material.

**Scope:**
- Source code comments → English.
- UI strings (plugin labels, error messages, filter names, button text) → English.
- Commit messages, pull request descriptions → English.
- Schema `description` fields → English.
- `docs/` files (DESIGN_DECISIONS.md, LESSONS_LEARNED.md, README) → English.

**Enforcement:** A Cursor workspace rule (`.cursor/rules/english-only.mdc`) is present in each repository to remind AI-assisted development of this convention.

---

## Related catalogs

| Catalog | Link direction |
|---------|---------------|
| Credential catalog | Issuer → Credential (via `credentialCatalogRef` in `credentialConfigurations[]`) |
| Wallet catalog | Issuer → Business Wallet (via `supportedWallets[]`, optional) |
| RP catalog | Independent (RPs consume credentials; issuers produce them) |
