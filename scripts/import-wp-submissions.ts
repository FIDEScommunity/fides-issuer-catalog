#!/usr/bin/env tsx
/**
 * Import published WordPress issuer submissions into community-catalogs/.
 *
 * One issuer is merged per export entry; sibling issuers remain untouched.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.cwd());
const COMMUNITY_DIR = path.join(ROOT, 'community-catalogs');
const STATE_PATH = path.join(ROOT, 'data/wp-submission-state.json');
const EXPORT_PATH = process.env.FIDES_WP_EXPORT_FILE
  ? path.resolve(ROOT, process.env.FIDES_WP_EXPORT_FILE)
  : path.join(ROOT, 'data/wp-export/issuer.json');
const FILENAME = 'issuer-catalog.json';
const MARKER = '.wordpress-source';
const SCHEMA = 'https://fides.community/schemas/issuer-catalog/v1';

export type WpExportEntry = {
  itemId: string;
  slug: string;
  filename: string;
  source: string;
  document: Record<string, unknown>;
  publishedAt?: string | null;
};

export type WpExportPayload = {
  schemaVersion: string;
  catalogType: string;
  generatedAt: string;
  entries: WpExportEntry[];
};

export type ManagedIssuer = { slug: string; issuerId: string };
export type WpSubmissionState = {
  schemaVersion: '1.0.0';
  catalogType: string;
  lastImportAt: string | null;
  managedIssuers: ManagedIssuer[];
};

type IssuerRecord = Record<string, unknown> & { id?: string };
type IssuerCatalogDoc = {
  $schema?: string;
  orgId?: string;
  issuers?: IssuerRecord[];
  lastUpdated?: string;
};
type ImportPlan = {
  groups: Array<{ slug: string; entries: WpExportEntry[] }>;
  prune: ManagedIssuer[];
  skipped: Array<{ slug: string; reason: string }>;
};

export function emptyState(catalogType = 'issuer'): WpSubmissionState {
  return {
    schemaVersion: '1.0.0',
    catalogType,
    lastImportAt: null,
    managedIssuers: [],
  };
}

export function issuerFromEntry(entry: WpExportEntry): IssuerRecord | null {
  const issuers = entry.document.issuers;
  if (!Array.isArray(issuers) || !issuers[0] || typeof issuers[0] !== 'object') return null;
  const issuer = issuers[0] as IssuerRecord;
  const id = String(issuer.id || entry.itemId || '').trim();
  return id ? { ...issuer, id } : null;
}

export function mergeIssuerIntoCatalog(
  base: IssuerCatalogDoc | null,
  entry: WpExportEntry,
): IssuerCatalogDoc {
  const issuer = issuerFromEntry(entry);
  if (!issuer) throw new Error(`Export entry ${entry.itemId} has no issuer object.`);
  const orgId = String(entry.document.orgId || '').trim();
  if (base?.orgId && orgId && base.orgId !== orgId) {
    throw new Error(`Export entry ${entry.itemId} orgId does not match catalog ${entry.slug}.`);
  }
  const issuers = Array.isArray(base?.issuers) ? [...base.issuers] : [];
  const index = issuers.findIndex((item) => String(item.id || '') === issuer.id);
  if (index >= 0) issuers[index] = { ...issuers[index], ...issuer };
  else issuers.push(issuer);
  const modified = typeof entry.document.lastUpdated === 'string'
    ? entry.document.lastUpdated.trim()
    : '';
  return {
    $schema: SCHEMA,
    orgId: orgId || base?.orgId,
    issuers,
    lastUpdated: modified || base?.lastUpdated || new Date().toISOString(),
  };
}

export function buildImportPlan(entries: WpExportEntry[], previous: WpSubmissionState): ImportPlan {
  const groups = new Map<string, WpExportEntry[]>();
  const current = new Set<string>();
  const skipped: ImportPlan['skipped'] = [];
  for (const entry of entries) {
    const slug = String(entry.slug || '').trim();
    const issuerId = String(entry.itemId || '').trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)
      || !/^issuer:[a-z0-9]+:[a-z0-9-]+:(production|test)$/.test(issuerId)
      || entry.filename !== FILENAME
      || !issuerFromEntry(entry)) {
      skipped.push({ slug: slug || '(missing)', reason: 'invalid entry metadata or issuer document' });
      continue;
    }
    const list = groups.get(slug) ?? [];
    list.push(entry);
    groups.set(slug, list);
    current.add(`${slug}:${issuerId}`);
  }
  return {
    groups: [...groups].map(([slug, groupedEntries]) => ({ slug, entries: groupedEntries })),
    prune: previous.managedIssuers.filter((item) => !current.has(`${item.slug}:${item.issuerId}`)),
    skipped,
  };
}

export async function loadCommittedExportPayload(
  filePath = EXPORT_PATH,
): Promise<WpExportPayload | null> {
  try {
    const payload = JSON.parse(await fs.readFile(filePath, 'utf8')) as WpExportPayload;
    if (!Array.isArray(payload?.entries)) throw new Error('entries array is missing');
    return payload;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new Error(`Invalid committed export ${path.relative(ROOT, filePath)}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function inlineExport(): WpExportPayload | null {
  const json = process.env.FIDES_WP_EXPORT_JSON?.trim();
  if (!json) return null;
  const payload = JSON.parse(json) as WpExportPayload;
  if (!Array.isArray(payload?.entries)) throw new Error('Inline export entries array is missing.');
  return payload;
}

async function fetchExport(url: string, secret: string): Promise<WpExportPayload> {
  if (!secret) throw new Error('Missing FIDES_CATALOG_SECRET or WP_INVALIDATE_SECRET.');
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-FIDES-Catalog-Secret': secret,
      'User-Agent': 'FIDES-Catalog-Automation/1.0',
    },
    signal: AbortSignal.timeout(60_000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`WP export failed (HTTP ${response.status}): ${body.slice(0, 300)}`);
  const payload = JSON.parse(body) as WpExportPayload;
  if (!Array.isArray(payload?.entries)) throw new Error('WP export entries array is missing.');
  return payload;
}

async function loadExport(url: string, secret: string): Promise<WpExportPayload> {
  const inline = inlineExport();
  if (inline) return inline;
  const committed = await loadCommittedExportPayload();
  if (committed) return committed;
  if (process.env.GITHUB_EVENT_NAME === 'repository_dispatch') {
    throw new Error('repository_dispatch did not include FIDES_WP_EXPORT_JSON.');
  }
  return fetchExport(url, secret);
}

async function readState(): Promise<WpSubmissionState> {
  try {
    const state = JSON.parse(await fs.readFile(STATE_PATH, 'utf8')) as WpSubmissionState;
    return Array.isArray(state?.managedIssuers) ? state : emptyState();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyState();
    throw error;
  }
}

async function readCatalog(slug: string): Promise<IssuerCatalogDoc | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(COMMUNITY_DIR, slug, FILENAME), 'utf8')) as IssuerCatalogDoc;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function readMarker(slug: string): Promise<{ issuers?: Record<string, unknown> } | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(COMMUNITY_DIR, slug, MARKER), 'utf8'));
  } catch {
    return null;
  }
}

async function applyPlan(plan: ImportPlan, apply: boolean): Promise<WpSubmissionState> {
  const managed: ManagedIssuer[] = [];
  for (const group of plan.groups) {
    let doc = await readCatalog(group.slug);
    for (const entry of group.entries) {
      doc = mergeIssuerIntoCatalog(doc, entry);
      managed.push({ slug: group.slug, issuerId: entry.itemId });
    }
    if (apply) {
      const dir = path.join(COMMUNITY_DIR, group.slug);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, FILENAME), `${JSON.stringify(doc, null, 2)}\n`);
      const oldMarker = await readMarker(group.slug);
      const markerIssuers = { ...(oldMarker?.issuers ?? {}) };
      for (const entry of group.entries) {
        markerIssuers[entry.itemId] = {
          itemId: entry.itemId,
          publishedAt: entry.publishedAt ?? null,
        };
      }
      await fs.writeFile(path.join(dir, MARKER), `${JSON.stringify({
        source: 'wordpress',
        slug: group.slug,
        issuers: markerIssuers,
        importedAt: new Date().toISOString(),
      }, null, 2)}\n`);
    }
    console.log(`${apply ? 'WRITE' : 'DRY '} ${group.slug} (${group.entries.length} issuer(s))`);
  }

  for (const stale of plan.prune) {
    const marker = await readMarker(stale.slug);
    if (!marker?.issuers || !(stale.issuerId in marker.issuers)) {
      console.log(`SKIP  prune ${stale.slug}/${stale.issuerId} — not WP-managed`);
      continue;
    }
    const doc = await readCatalog(stale.slug);
    if (!doc) continue;
    const next = {
      ...doc,
      issuers: (doc.issuers ?? []).filter((item) => item.id !== stale.issuerId),
      lastUpdated: new Date().toISOString(),
    };
    if (apply) {
      const dir = path.join(COMMUNITY_DIR, stale.slug);
      if (!next.issuers.length) {
        await fs.rm(dir, { recursive: true, force: true });
      } else {
        delete marker.issuers[stale.issuerId];
        await fs.writeFile(path.join(dir, FILENAME), `${JSON.stringify(next, null, 2)}\n`);
        await fs.writeFile(path.join(dir, MARKER), `${JSON.stringify(marker, null, 2)}\n`);
      }
    }
    console.log(`${apply ? 'PRUNE' : 'DRY  prune'} ${stale.slug}/${stale.issuerId}`);
  }

  for (const skipped of plan.skipped) console.log(`SKIP  ${skipped.slug} — ${skipped.reason}`);
  const unique = new Map(managed.map((item) => [`${item.slug}:${item.issuerId}`, item]));
  return {
    schemaVersion: '1.0.0',
    catalogType: 'issuer',
    lastImportAt: apply ? new Date().toISOString() : null,
    managedIssuers: [...unique.values()].sort((a, b) => `${a.slug}:${a.issuerId}`.localeCompare(`${b.slug}:${b.issuerId}`)),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const urlIndex = args.indexOf('--wp-url');
  const url = urlIndex >= 0 && args[urlIndex + 1]
    ? args[urlIndex + 1]!
    : process.env.FIDES_WP_EXPORT_URL ?? 'http://utrecht-demo.local/wp-json/fides-catalog/v1/export/issuer';
  const secret = process.env.FIDES_CATALOG_SECRET ?? process.env.WP_INVALIDATE_SECRET ?? '';
  const previous = await readState();
  const payload = await loadExport(url, secret);
  const plan = buildImportPlan(payload.entries, previous);
  console.log(`Mode: ${apply ? 'apply' : 'dry-run'}; entries: ${payload.entries.length}; groups: ${plan.groups.length}; prune: ${plan.prune.length}`);
  const next = await applyPlan(plan, apply);
  if (apply) {
    await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
    await fs.writeFile(STATE_PATH, `${JSON.stringify(next, null, 2)}\n`);
  }
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false;
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
