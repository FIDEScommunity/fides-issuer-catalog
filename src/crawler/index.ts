import * as fs from 'fs';
import * as path from 'path';
import { hostname } from 'os';
import { execFileSync } from 'child_process';
import type {
  SourceIssuerCatalog,
  SourceIssuer,
  Oid4vciMetadata,
  Oid4vciCredentialConfiguration,
  AggregatedIssuer,
  AggregatedIssuerCatalog,
  AggregatedCredentialConfiguration,
  AggregatedCredentialCatalogRef,
  AggregatedOrganization,
  IssuerHistoryState,
} from '../types/issuer.js';

const ROOT = path.resolve(process.cwd());
const COMMUNITY_CATALOGS_DIR = path.join(ROOT, 'community-catalogs');
const DATA_DIR = path.join(ROOT, 'data');
const HISTORY_STATE_FILE = path.join(DATA_DIR, 'issuer-history-state.json');
const AGGREGATED_FILE = path.join(DATA_DIR, 'aggregated.json');
const WP_DATA_DIR = path.join(ROOT, 'wordpress-plugin', 'fides-issuer-catalog', 'data');

// Primary: credential catalog from GitHub (used in deploy/CI). Fallback: local file when fetch fails.
const CREDENTIAL_CATALOG_URL =
  'https://raw.githubusercontent.com/FIDEScommunity/fides-credential-catalog/main/data/aggregated.json';
const CREDENTIAL_CATALOG_LOCAL_PATHS = [
  process.env.CREDENTIAL_CATALOG_AGGREGATED_PATH,
  path.join(ROOT, '..', 'credential-catalog', 'data', 'aggregated.json'),
].filter(Boolean) as string[];

const ORGANIZATION_CATALOG_URL =
  'https://raw.githubusercontent.com/FIDEScommunity/fides-organization-catalog/main/data/aggregated.json';
const ORGANIZATION_CATALOG_LOCAL_PATHS = [
  process.env.ORGANIZATION_CATALOG_AGGREGATED_PATH,
  path.join(ROOT, '..', 'organization-catalog', 'data', 'aggregated.json'),
].filter(Boolean) as string[];

interface OrgCatalogEntry {
  id: string;
  name: string;
  identifiers?: { did?: string };
  website?: string;
  logoUri?: string;
  contact?: { email?: string; support?: string };
  legalName?: string;
}

// Fetch with timeout
async function fetchJson<T>(url: string, timeoutMs = 10000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// Get last git commit date for a file path
function getGitLastCommitDateForPath(filePath: string): string | null {
  try {
    const result = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', filePath],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const date = result.toString().trim();
    return date || null;
  } catch {
    return null;
  }
}

// Find all issuer-catalog.json source files
function findSourceFiles(): string[] {
  const files: string[] = [];
  if (!fs.existsSync(COMMUNITY_CATALOGS_DIR)) return files;
  const orgs = fs.readdirSync(COMMUNITY_CATALOGS_DIR);
  for (const org of orgs) {
    const candidate = path.join(COMMUNITY_CATALOGS_DIR, org, 'issuer-catalog.json');
    if (fs.existsSync(candidate)) {
      files.push(candidate);
    }
  }
  return files;
}

// Load credential catalog for cross-catalog matching
interface CredentialEntry {
  id: string;
  displayName?: string;
  nativeIdentifier?: string;
  nativeIdentifierType?: string;
  vcFormat?: string;
}

/** Same logic as WordPress plugin: .local or localhost = local dev → use local credential catalog when available */
function isLocalDevHost(): boolean {
  const host = hostname();
  return host !== '' && (host.endsWith('.local') || host === 'localhost');
}

async function loadOrganizationCatalogMap(): Promise<Map<string, OrgCatalogEntry>> {
  const useLocal = isLocalDevHost();

  const tryParse = (raw: string): Map<string, OrgCatalogEntry> => {
    const data = JSON.parse(raw) as { organizations?: OrgCatalogEntry[] };
    const map = new Map<string, OrgCatalogEntry>();
    for (const o of data.organizations || []) {
      if (o?.id) map.set(o.id, o);
    }
    return map;
  };

  if (useLocal) {
    for (const localPath of ORGANIZATION_CATALOG_LOCAL_PATHS) {
      if (localPath && fs.existsSync(localPath)) {
        try {
          const raw = fs.readFileSync(localPath, 'utf-8');
          const map = tryParse(raw);
          console.log(`  (using local organization catalog: ${localPath}, ${map.size} organizations)`);
          return map;
        } catch (parseErr) {
          console.warn('Could not parse local organization catalog:', (parseErr as Error).message);
        }
      }
    }
  }

  try {
    const data = await fetchJson<{ organizations?: OrgCatalogEntry[] }>(ORGANIZATION_CATALOG_URL);
    const map = new Map<string, OrgCatalogEntry>();
    for (const o of data.organizations || []) {
      if (o?.id) map.set(o.id, o);
    }
    console.log(`  (using organization catalog from GitHub, ${map.size} organizations)`);
    return map;
  } catch (err) {
    console.warn('Could not fetch organization catalog from GitHub:', (err as Error).message);
    for (const localPath of ORGANIZATION_CATALOG_LOCAL_PATHS) {
      if (localPath && fs.existsSync(localPath)) {
        try {
          const raw = fs.readFileSync(localPath, 'utf-8');
          const map = tryParse(raw);
          console.log(`  (fallback: using local ${localPath})`);
          return map;
        } catch (parseErr) {
          console.warn('Could not parse local organization catalog:', (parseErr as Error).message);
        }
      }
    }
    return new Map();
  }
}

function orgEntryToAggregatedOrganization(entry: OrgCatalogEntry): AggregatedOrganization {
  return {
    name: entry.name,
    did: entry.identifiers?.did,
    website: entry.website,
    logoUri: entry.logoUri,
  };
}

async function loadCredentialCatalog(): Promise<CredentialEntry[]> {
  const useLocal = isLocalDevHost();

  if (useLocal) {
    for (const localPath of CREDENTIAL_CATALOG_LOCAL_PATHS) {
      if (localPath && fs.existsSync(localPath)) {
        try {
          const raw = fs.readFileSync(localPath, 'utf-8');
          const data = JSON.parse(raw) as { credentials?: CredentialEntry[] };
          const list = data.credentials || [];
          console.log(`  (using local credential catalog: ${localPath}, ${list.length} credentials)`);
          return list;
        } catch (parseErr) {
          console.warn('Could not parse local credential catalog:', (parseErr as Error).message);
        }
      }
    }
  }

  try {
    const data = await fetchJson<{ credentials?: CredentialEntry[] }>(CREDENTIAL_CATALOG_URL);
    console.log(`  (using credential catalog from GitHub, ${(data.credentials || []).length} credentials)`);
    return data.credentials || [];
  } catch (err) {
    console.warn('Could not fetch credential catalog from GitHub:', (err as Error).message);
    for (const localPath of CREDENTIAL_CATALOG_LOCAL_PATHS) {
      if (localPath && fs.existsSync(localPath)) {
        try {
          const raw = fs.readFileSync(localPath, 'utf-8');
          const data = JSON.parse(raw) as { credentials?: CredentialEntry[] };
          const list = data.credentials || [];
          console.log(`  (fallback: using local ${localPath})`);
          return list;
        } catch (parseErr) {
          console.warn('Could not parse local credential catalog:', (parseErr as Error).message);
        }
      }
    }
    return [];
  }
}

// Match a credential configuration to the credential catalog
function matchCredentialCatalog(
  config: Oid4vciCredentialConfiguration,
  credentialEntries: CredentialEntry[]
): AggregatedCredentialCatalogRef | undefined {
  const identifier =
    config.vct ||
    config.doctype ||
    config.credential_definition?.type?.find(t => t !== 'VerifiableCredential');

  if (!identifier) return undefined;

  const matches = credentialEntries.filter((c) => c.nativeIdentifier === identifier);
  if (!matches.length) return undefined;

  // When several catalog credentials share the same native identifier (e.g. EU vs ISO mDL),
  // prefer the ISO-anchored entry as the normative authority.
  const isoPreferred = matches.find((c) => typeof c.id === 'string' && c.id.startsWith('cred:iso:'));
  const match = isoPreferred || matches[0];

  return {
    id: match.id,
    displayName: match.displayName,
  };
}

// Extract signing algorithms from credential configuration.
// OID4VCI drafts use different fields; check all known locations.
function extractSigningAlgorithms(config: Oid4vciCredentialConfiguration): string[] {
  // Draft 13+: credential_signing_alg_values_supported
  if (config.credential_signing_alg_values_supported?.length) {
    return config.credential_signing_alg_values_supported;
  }
  // Draft 11/12: proof_types_supported.*.proof_signing_alg_values_supported
  if (config.proof_types_supported) {
    const algs = Object.values(config.proof_types_supported as Record<string, { proof_signing_alg_values_supported?: string[] }>)
      .flatMap((pt) => pt.proof_signing_alg_values_supported || []);
    if (algs.length) return [...new Set(algs)];
  }
  // Older drafts: cryptographic_suites_supported
  const cfg = config as unknown as Record<string, unknown>;
  if (cfg.cryptographic_suites_supported) {
    const suites = cfg.cryptographic_suites_supported as string[];
    if (suites.length) return suites;
  }
  return [];
}

// Extract proof types from credential configuration
function extractProofTypes(config: Oid4vciCredentialConfiguration): string[] {
  if (!config.proof_types_supported) return [];
  return Object.keys(config.proof_types_supported);
}

// Get display name for a credential configuration
function getConfigDisplayName(
  configId: string,
  config: Oid4vciCredentialConfiguration
): string {
  if (config.display && config.display.length > 0) {
    const englishDisplay = config.display.find((d) => !d.locale || d.locale.startsWith('en'));
    const display = englishDisplay || config.display[0];
    if (display.name) return display.name;
  }
  return configId;
}

// Get logo URI from credential configuration display
function getConfigLogoUri(config: Oid4vciCredentialConfiguration): string | undefined {
  if (config.display && config.display.length > 0) {
    const englishDisplay = config.display.find((d) => !d.locale || d.locale.startsWith('en'));
    const display = englishDisplay || config.display[0];
    return display.logo?.uri;
  }
  return undefined;
}

// Map OID4VCI format string to canonical vcFormat
function mapVcFormat(format: string): string {
  const formatMap: Record<string, string> = {
    'vc+sd-jwt': 'sd_jwt_vc',
    'dc+sd-jwt': 'sd_jwt_vc',
    'jwt_vc_json': 'vcdm_1_1',
    'jwt_vc': 'vcdm_1_1',
    'ldp_vc': 'vcdm_1_1',
    'jwt_vc_json-ld': 'vcdm_1_1',
    'vc+ld-json': 'vcdm_2_0',
    'mso_mdoc': 'mdoc',
  };
  return formatMap[format] || format;
}

// Enrich credential configurations from OID4VCI metadata
function enrichCredentialConfigurations(
  metadata: Oid4vciMetadata,
  credentialEntries: CredentialEntry[]
): AggregatedCredentialConfiguration[] {
  if (!metadata.credential_configurations_supported) return [];

  return Object.entries(metadata.credential_configurations_supported).map(
    ([configId, config]) => {
      const catalogRef = matchCredentialCatalog(config, credentialEntries);
      return {
        configurationId: configId,
        displayName: getConfigDisplayName(configId, config),
        vcFormat: mapVcFormat(config.format),
        vct: config.vct,
        docType: config.doctype,
        signingAlgorithms: extractSigningAlgorithms(config),
        proofTypes: extractProofTypes(config),
        cryptographicBindingMethods: config.cryptographic_binding_methods_supported || [],
        logoUri: getConfigLogoUri(config),
        credentialCatalogRef: catalogRef,
      };
    }
  );
}

function catalogVcFormatToAggregated(fmt: string | undefined): string {
  if (!fmt) return 'unknown';
  if (fmt === 'mdoc' || fmt === 'sd_jwt_vc') return fmt;
  return fmt;
}

/** Non-OID4VCI issuers: build credentialConfigurations from manual credentialRefs (for cross-catalog linking). */
function configurationsFromCredentialRefs(
  refs: NonNullable<SourceIssuer['credentialRefs']>,
  credentialEntries: CredentialEntry[]
): AggregatedCredentialConfiguration[] {
  return refs.map((ref) => {
    const catalogEntry = credentialEntries.find((c) => c.id === ref.id);
    const docType =
      catalogEntry?.nativeIdentifierType === 'docType'
        ? catalogEntry.nativeIdentifier
        : undefined;
    return {
      configurationId: `manual:${ref.id}`,
      displayName: ref.displayName || catalogEntry?.displayName || ref.id,
      vcFormat: catalogVcFormatToAggregated(catalogEntry?.vcFormat),
      docType,
      signingAlgorithms: [],
      proofTypes: [],
      cryptographicBindingMethods: [],
      credentialCatalogRef: {
        id: ref.id,
        displayName: ref.displayName || catalogEntry?.displayName,
      },
    };
  });
}

// Get issuer display name from OID4VCI metadata
function getIssuerDisplayName(
  metadata: Oid4vciMetadata,
  sourceIssuer: SourceIssuer
): string {
  if (sourceIssuer.displayName) return sourceIssuer.displayName;
  if (metadata.display && metadata.display.length > 0) {
    const englishDisplay = metadata.display.find((d) => !d.locale || d.locale.startsWith('en'));
    const display = englishDisplay || metadata.display[0];
    if (display.name) return display.name;
  }
  return sourceIssuer.id;
}

// Get logo URI from OID4VCI metadata
function getIssuerLogoUri(
  metadata: Oid4vciMetadata,
  catalogLogoUri: string | undefined
): string | undefined {
  if (catalogLogoUri) return catalogLogoUri;
  if (metadata.display && metadata.display.length > 0) {
    const englishDisplay = metadata.display.find((d) => !d.locale || d.locale.startsWith('en'));
    const display = englishDisplay || metadata.display[0];
    return display.logo?.uri;
  }
  return undefined;
}

// Load history state
function loadHistoryState(): IssuerHistoryState {
  if (fs.existsSync(HISTORY_STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_STATE_FILE, 'utf-8')) as IssuerHistoryState;
    } catch {
      return {};
    }
  }
  return {};
}

// Save history state
function saveHistoryState(state: IssuerHistoryState): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// Main crawler
async function crawl(): Promise<void> {
  console.log('🔍 FIDES Issuer Catalog Crawler\n');

  const fetchedAt = new Date().toISOString();
  const historyState = loadHistoryState();
  const sourceFiles = findSourceFiles();

  console.log(`Found ${sourceFiles.length} source file(s)\n`);

  // Load credential catalog for cross-catalog matching
  console.log('Loading credential catalog for cross-catalog matching...');
  const credentialEntries = await loadCredentialCatalog();
  console.log(`  → ${credentialEntries.length} credentials loaded\n`);

  console.log('Loading organization catalog for orgId resolution...');
  const organizationById = await loadOrganizationCatalogMap();
  console.log(`  → ${organizationById.size} organizations loaded\n`);

  const allIssuers: AggregatedIssuer[] = [];

  for (const sourceFile of sourceFiles) {
    const catalog = JSON.parse(fs.readFileSync(sourceFile, 'utf-8')) as SourceIssuerCatalog;
    const orgEntry = organizationById.get(catalog.orgId);
    if (!orgEntry) {
      console.error(`  ❌ Unknown orgId ${catalog.orgId} in ${sourceFile} — add this organization to fides-organization-catalog first.`);
      continue;
    }
    const organization = orgEntryToAggregatedOrganization(orgEntry);
    const gitDate = getGitLastCommitDateForPath(sourceFile);

    console.log(`${catalog.orgId}: ${organization.name} (${catalog.issuers.length} issuer(s))`);

    for (const sourceIssuer of catalog.issuers) {
      const protocol = sourceIssuer.issuanceProtocol;
      console.log(`  → ${sourceIssuer.id} [${sourceIssuer.environment}] [${protocol}]`);

      let metadata: Oid4vciMetadata = { credential_issuer: '' };
      let fetchError: string | undefined;

      if (protocol === 'oid4vci') {
        const metaUrl = sourceIssuer.oid4vciMetadataUrl!;
        console.log(`    Fetching ${metaUrl} ...`);
        try {
          metadata = await fetchJson<Oid4vciMetadata>(metaUrl);
          console.log(
            `    ✅ OK — ${Object.keys(metadata.credential_configurations_supported || {}).length} credential configuration(s)`
          );
        } catch (err) {
          fetchError = (err as Error).message;
          console.warn(`    ⚠️  Fetch failed: ${fetchError}`);
        }
      } else {
        console.log(`    Skipping OID4VCI fetch (issuanceProtocol=other)`);
      }

      const organizationResolved: AggregatedOrganization = {
        ...organization,
        logoUri: getIssuerLogoUri(metadata, organization.logoUri),
      };

      let credentialConfigurations: AggregatedCredentialConfiguration[];

      if (protocol === 'oid4vci') {
        credentialConfigurations = enrichCredentialConfigurations(metadata, credentialEntries);
        if (sourceIssuer.credentialRefs && sourceIssuer.credentialRefs.length > 0) {
          for (const config of credentialConfigurations) {
            if (!config.credentialCatalogRef) {
              const manualRef = sourceIssuer.credentialRefs.find(
                (r) => r.id === config.configurationId || r.displayName === config.displayName
              );
              if (manualRef) {
                config.credentialCatalogRef = { id: manualRef.id, displayName: manualRef.displayName };
              }
            }
          }
        }
      } else {
        credentialConfigurations = configurationsFromCredentialRefs(
          sourceIssuer.credentialRefs || [],
          credentialEntries
        );
      }

      // Persist firstSeenAt
      if (!historyState[sourceIssuer.id]) {
        historyState[sourceIssuer.id] = { firstSeenAt: fetchedAt };
      }

      const updatedAt = gitDate || catalog.lastUpdated || fetchedAt;

      const credentialIssuerUrl =
        protocol === 'oid4vci'
          ? metadata.credential_issuer ||
            sourceIssuer.oid4vciMetadataUrl!.replace('/.well-known/openid-credential-issuer', '')
          : sourceIssuer.issuerWebsiteUrl ||
            organization.website ||
            'https://www.iata.org';

      const aggregated: AggregatedIssuer = {
        id: sourceIssuer.id,
        orgId: catalog.orgId,
        organization: organizationResolved,
        displayName: getIssuerDisplayName(metadata, sourceIssuer),
        environment: sourceIssuer.environment,
        issuanceProtocol: protocol,
        credentialIssuerUrl,
        ...(protocol === 'oid4vci' && sourceIssuer.oid4vciMetadataUrl
          ? { oid4vciMetadataUrl: sourceIssuer.oid4vciMetadataUrl }
          : {}),
        logoUri: getIssuerLogoUri(metadata, organization.logoUri),
        ...(sourceIssuer.description ? { description: sourceIssuer.description } : {}),
        ...(sourceIssuer.issuerWebsiteUrl
          ? { issuerWebsiteUrl: sourceIssuer.issuerWebsiteUrl }
          : {}),
        projectContext: sourceIssuer.projectContext,
        credentialConfigurations,
        supportedWallets: sourceIssuer.supportedWallets?.map((w) => ({
          id: w.id,
          displayName: w.displayName,
        })) || [],
        firstSeenAt: historyState[sourceIssuer.id].firstSeenAt,
        updatedAt,
        fetchedAt,
        ...(fetchError ? { metadataFetchError: fetchError } : {}),
      };

      allIssuers.push(aggregated);
    }
  }

  // Compute stats
  const stats = {
    totalIssuers: allIssuers.length,
    productionIssuers: allIssuers.filter((i) => i.environment === 'production').length,
    totalOrganizations: new Set(allIssuers.map((i) => i.orgId)).size,
    totalCredentialConfigurations: allIssuers.reduce(
      (sum, i) => sum + i.credentialConfigurations.length,
      0
    ),
  };

  const output: AggregatedIssuerCatalog = {
    schemaVersion: '1.3.0',
    catalogType: 'issuer-catalog',
    lastUpdated: fetchedAt,
    issuers: allIssuers,
    stats,
  };

  // Write output files
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(AGGREGATED_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ Written to ${AGGREGATED_FILE}`);

  // Also write to WordPress plugin data directory if it exists
  if (fs.existsSync(path.dirname(WP_DATA_DIR)) || fs.existsSync(WP_DATA_DIR)) {
    fs.mkdirSync(WP_DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(WP_DATA_DIR, 'aggregated.json'), JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ Written to ${WP_DATA_DIR}/aggregated.json`);
  }

  saveHistoryState(historyState);
  console.log(`✅ History state updated (${Object.keys(historyState).length} issuer(s) tracked)`);

  console.log(`\n📊 Stats:`);
  console.log(`   Issuers:           ${stats.totalIssuers}`);
  console.log(`   Production:        ${stats.productionIssuers}`);
  console.log(`   Organizations:     ${stats.totalOrganizations}`);
  console.log(`   Configurations:    ${stats.totalCredentialConfigurations}`);
}

crawl().catch((err) => {
  console.error('Crawler failed:', err);
  process.exit(1);
});
