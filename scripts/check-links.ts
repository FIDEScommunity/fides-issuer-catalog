/**
 * Linkcheck script for issuer catalog.
 * Reads data/aggregated.json, collects all URLs from issuers,
 * resolves OID4VCI issuer base URLs to metadata endpoints where appropriate,
 * deduplicates HTTP checks, and writes data/linkcheck-report.json + linkcheck-summary.md.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const AGGREGATED_PATH = join(process.cwd(), 'data/aggregated.json');
const REPORT_JSON_PATH = join(process.cwd(), 'data/linkcheck-report.json');
const REPORT_MD_PATH = join(process.cwd(), 'data/linkcheck-summary.md');
const REQUEST_TIMEOUT_MS = 10_000;
const DELAY_BETWEEN_REQUESTS_MS = 300;

const OID4VCI_METADATA_SUFFIX = '/.well-known/openid-credential-issuer';

function isHttpUrl(s: string): boolean {
  return typeof s === 'string' && (s.startsWith('http://') || s.startsWith('https://'));
}

interface LinkContext {
  itemId: string;
  field: string;
  providerName: string;
}

function addUrl(
  map: Map<string, { contexts: LinkContext[] }>,
  url: string,
  context: LinkContext
) {
  const normalized = url.trim();
  if (!isHttpUrl(normalized)) return;
  const existing = map.get(normalized);
  if (existing) {
    if (!existing.contexts.some(c => c.itemId === context.itemId && c.field === context.field)) {
      existing.contexts.push(context);
    }
  } else {
    map.set(normalized, { contexts: [context] });
  }
}

interface IssuerItem {
  id: string;
  displayName?: string;
  organization?: { name?: string; website?: string; logoUri?: string };
  issuerWebsiteUrl?: string;
  oid4vciMetadataUrl?: string;
  credentialIssuerUrl?: string;
  logoUri?: string;
}

interface AggregatedData {
  issuers: IssuerItem[];
}

function collectIssuerUrls(
  issuers: IssuerItem[],
  urlToContexts: Map<string, { contexts: LinkContext[] }>
) {
  for (const i of issuers) {
    const providerName = i.organization?.name ?? 'Unknown';
    const ctx = (field: string): LinkContext => ({ itemId: i.id, field, providerName });

    if (i.organization?.website) addUrl(urlToContexts, i.organization.website, ctx('organization.website'));
    if (i.organization?.logoUri) addUrl(urlToContexts, i.organization.logoUri, ctx('organization.logoUri'));
    if (i.issuerWebsiteUrl) addUrl(urlToContexts, i.issuerWebsiteUrl, ctx('issuerWebsiteUrl'));
    if (i.oid4vciMetadataUrl) addUrl(urlToContexts, i.oid4vciMetadataUrl, ctx('oid4vciMetadataUrl'));
    if (i.credentialIssuerUrl) addUrl(urlToContexts, i.credentialIssuerUrl, ctx('credentialIssuerUrl'));
    if (i.logoUri) addUrl(urlToContexts, i.logoUri, ctx('logoUri'));
  }
}

function stripTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * OID4VCI issuer identifiers often do not serve HEAD/GET on the bare path; metadata lives at
 * /.well-known/openid-credential-issuer. When the catalog URL only appears as credentialIssuerUrl,
 * check that metadata URL instead.
 */
function resolveEffectiveCheckUrl(catalogUrl: string, contexts: LinkContext[]): string {
  const trimmed = catalogUrl.trim();
  const onlyCredentialIssuer =
    contexts.length > 0 && contexts.every(c => c.field === 'credentialIssuerUrl');
  if (!onlyCredentialIssuer) return trimmed;

  const base = stripTrailingSlashes(trimmed);
  if (base.endsWith(OID4VCI_METADATA_SUFFIX)) return trimmed;
  return `${base}${OID4VCI_METADATA_SUFFIX}`;
}

function shouldSkipUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (
      (u.hostname === 'www.google.com' || u.hostname === 'google.com') &&
      u.pathname === '/s2/favicons'
    ) {
      return 'Google favicon helper URLs are excluded (often flaky for automated checks).';
    }
  } catch {
    return 'Invalid URL.';
  }
  return null;
}

async function fetchWithMethod(
  url: string,
  method: 'HEAD' | 'GET'
): Promise<{ ok: boolean; status: number }> {
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { 'User-Agent': 'FIDES-Issuer-Catalog-Linkcheck/1.0' },
  });
  const ok = res.status >= 200 && res.status < 400;
  return { ok, status: res.status };
}

function shouldRetryWithGetAfterHead(status: number | undefined): boolean {
  if (status === undefined) return true;
  return status === 405 || status === 404 || status === 403;
}

async function checkHttpUrl(
  effectiveUrl: string
): Promise<{ ok: boolean; status?: number; error?: string; via?: string }> {
  try {
    const head = await fetchWithMethod(effectiveUrl, 'HEAD');
    if (head.ok) return { ok: true, status: head.status, via: 'HEAD' };
    if (!shouldRetryWithGetAfterHead(head.status)) {
      return { ok: false, status: head.status, error: `HTTP ${head.status}`, via: 'HEAD' };
    }
    const get = await fetchWithMethod(effectiveUrl, 'GET');
    if (get.ok) return { ok: true, status: get.status, via: 'GET' };
    return {
      ok: false,
      status: get.status,
      error: `HTTP ${get.status} (HEAD was ${head.status})`,
      via: 'GET',
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    try {
      const get = await fetchWithMethod(effectiveUrl, 'GET');
      if (get.ok) return { ok: true, status: get.status, via: 'GET' };
      return {
        ok: false,
        status: get.status,
        error: `${message}; GET HTTP ${get.status}`,
        via: 'GET',
      };
    } catch (e2) {
      const m2 = e2 instanceof Error ? e2.message : String(e2);
      return { ok: false, error: `${message}; GET: ${m2}` };
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface BrokenEntry {
  url: string;
  effectiveUrl?: string;
  status?: number;
  error: string;
  contexts: LinkContext[];
}

interface ByProviderEntry {
  brokenUrls: Array<{ url: string; error: string; status?: number; effectiveUrl?: string }>;
}

interface SkippedEntry {
  url: string;
  reason: string;
}

interface LinkcheckReport {
  runAt: string;
  /** Unique HTTP(S) strings collected from aggregated.json */
  totalCatalogUrls: number;
  /** URLs intentionally not checked */
  skippedCount: number;
  skipped?: SkippedEntry[];
  /** Distinct HTTP requests after resolving credentialIssuerUrl + deduplication */
  effectiveCheckCount: number;
  /** Same as historical field: catalog URLs accounted for (totalCatalogUrls - skippedCount) */
  totalUrls: number;
  brokenCount: number;
  broken: BrokenEntry[];
  byProvider: Record<string, ByProviderEntry>;
}

interface CatalogUrlWork {
  catalogUrl: string;
  contexts: LinkContext[];
  effectiveUrl: string;
}

async function main() {
  const raw = readFileSync(AGGREGATED_PATH, 'utf-8');
  const data: AggregatedData = JSON.parse(raw);
  const issuers = data.issuers ?? [];

  const urlToContexts = new Map<string, { contexts: LinkContext[] }>();
  collectIssuerUrls(issuers, urlToContexts);

  const skipped: SkippedEntry[] = [];
  const workList: CatalogUrlWork[] = [];

  for (const [catalogUrl, { contexts }] of urlToContexts) {
    const skipReason = shouldSkipUrl(catalogUrl);
    if (skipReason) {
      skipped.push({ url: catalogUrl, reason: skipReason });
      continue;
    }
    const effectiveUrl = resolveEffectiveCheckUrl(catalogUrl, contexts);
    workList.push({ catalogUrl, contexts, effectiveUrl });
  }

  const totalCatalogUrls = urlToContexts.size;
  const skippedCount = skipped.length;
  const totalUrls = workList.length;

  /** effectiveUrl -> catalog rows that depend on this check */
  const effectiveToRows = new Map<string, CatalogUrlWork[]>();
  for (const row of workList) {
    const list = effectiveToRows.get(row.effectiveUrl);
    if (list) list.push(row);
    else effectiveToRows.set(row.effectiveUrl, [row]);
  }

  const uniqueEffective = [...effectiveToRows.keys()];
  const effectiveCheckCount = uniqueEffective.length;
  console.log(
    `Checking ${effectiveCheckCount} unique HTTP target(s) (${totalUrls} catalog URL(s), ${skippedCount} skipped)...`
  );

  const effectiveResults = new Map<string, { ok: boolean; status?: number; error?: string }>();
  let checked = 0;
  for (const effectiveUrl of uniqueEffective) {
    const result = await checkHttpUrl(effectiveUrl);
    effectiveResults.set(effectiveUrl, {
      ok: result.ok,
      status: result.status,
      error: result.error,
    });
    checked++;
    if (checked % 50 === 0) console.log(`  ${checked}/${effectiveCheckCount}`);
    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  const broken: BrokenEntry[] = [];
  for (const row of workList) {
    const r = effectiveResults.get(row.effectiveUrl)!;
    if (!r.ok) {
      broken.push({
        url: row.catalogUrl,
        effectiveUrl: row.effectiveUrl !== row.catalogUrl ? row.effectiveUrl : undefined,
        status: r.status,
        error: r.error ?? 'Unknown error',
        contexts: row.contexts,
      });
    }
  }

  const byProvider: Record<string, ByProviderEntry> = {};
  for (const b of broken) {
    for (const ctx of b.contexts) {
      const name = ctx.providerName;
      if (!byProvider[name]) byProvider[name] = { brokenUrls: [] };
      const exists = byProvider[name].brokenUrls.some((u) => u.url === b.url);
      if (!exists) {
        byProvider[name].brokenUrls.push({
          url: b.url,
          error: b.error,
          status: b.status,
          effectiveUrl: b.effectiveUrl,
        });
      }
    }
  }

  const report: LinkcheckReport = {
    runAt: new Date().toISOString(),
    totalCatalogUrls,
    skippedCount,
    skipped: skippedCount > 0 ? skipped : undefined,
    effectiveCheckCount,
    totalUrls,
    brokenCount: broken.length,
    broken,
    byProvider,
  };

  writeFileSync(REPORT_JSON_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Report written to ${REPORT_JSON_PATH}`);

  let md = `# Issuer catalog linkcheck – ${report.runAt.slice(0, 10)}\n\n`;
  md += `- **Catalog URLs collected:** ${totalCatalogUrls}\n`;
  if (skippedCount > 0) {
    md += `- **Skipped (excluded):** ${skippedCount}\n`;
  }
  md += `- **Catalog URLs checked:** ${totalUrls}\n`;
  md += `- **HTTP checks performed:** ${effectiveCheckCount} (after OID4VCI resolution + deduplication)\n`;
  md += `- **Broken:** ${broken.length}\n\n`;
  if (broken.length > 0) {
    md += `## Broken links by provider\n\n`;
    for (const [providerName, entry] of Object.entries(byProvider)) {
      md += `### ${providerName}\n`;
      for (const u of entry.brokenUrls) {
        const suffix = u.effectiveUrl ? ` _(checked as ${u.effectiveUrl})_` : '';
        md += `- ${u.url} — ${u.error}${suffix}\n`;
      }
      md += `\n`;
    }
  }
  writeFileSync(REPORT_MD_PATH, md, 'utf-8');
  console.log(`Summary written to ${REPORT_MD_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
