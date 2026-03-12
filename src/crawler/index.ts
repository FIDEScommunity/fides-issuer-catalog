import * as fs from 'fs';
import * as path from 'path';
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

// URL to the credential catalog aggregated.json for cross-catalog matching
const CREDENTIAL_CATALOG_URL =
  'https://raw.githubusercontent.com/FIDEScommunity/fides-credential-catalog/main/data/aggregated.json';

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
}

async function loadCredentialCatalog(): Promise<CredentialEntry[]> {
  try {
    const data = await fetchJson<{ credentials?: CredentialEntry[] }>(CREDENTIAL_CATALOG_URL);
    return data.credentials || [];
  } catch (err) {
    console.warn('Could not load credential catalog for cross-catalog matching:', (err as Error).message);
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

  const match = credentialEntries.find(
    (c) => c.nativeIdentifier === identifier
  );
  if (!match) return undefined;

  return {
    id: match.id,
    displayName: match.displayName,
  };
}

// Extract signing algorithms from credential configuration
function extractSigningAlgorithms(config: Oid4vciCredentialConfiguration): string[] {
  return config.credential_signing_alg_values_supported || [];
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
  sourceOrg: SourceIssuerCatalog['organization']
): string | undefined {
  if (sourceOrg.logo) return sourceOrg.logo;
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

  const allIssuers: AggregatedIssuer[] = [];

  for (const sourceFile of sourceFiles) {
    const catalog = JSON.parse(fs.readFileSync(sourceFile, 'utf-8')) as SourceIssuerCatalog;
    const orgName = catalog.organization.name;
    const gitDate = getGitLastCommitDateForPath(sourceFile);

    console.log(`Organization: ${orgName} (${catalog.issuers.length} issuer(s))`);

    for (const sourceIssuer of catalog.issuers) {
      console.log(`  → ${sourceIssuer.id} [${sourceIssuer.environment}]`);
      console.log(`    Fetching ${sourceIssuer.oid4vciMetadataUrl} ...`);

      let metadata: Oid4vciMetadata = { credential_issuer: '' };
      let fetchError: string | undefined;

      try {
        metadata = await fetchJson<Oid4vciMetadata>(sourceIssuer.oid4vciMetadataUrl);
        console.log(
          `    ✅ OK — ${Object.keys(metadata.credential_configurations_supported || {}).length} credential configuration(s)`
        );
      } catch (err) {
        fetchError = (err as Error).message;
        console.warn(`    ⚠️  Fetch failed: ${fetchError}`);
      }

      const organization: AggregatedOrganization = {
        name: catalog.organization.name,
        did: catalog.organization.did,
        website: catalog.organization.website,
        logoUri: getIssuerLogoUri(metadata, catalog.organization),
      };

      const credentialConfigurations = enrichCredentialConfigurations(metadata, credentialEntries);

      // Apply manual credential refs as fallback for unmatched configurations
      if (sourceIssuer.credentialRefs && sourceIssuer.credentialRefs.length > 0) {
        for (const config of credentialConfigurations) {
          if (!config.credentialCatalogRef) {
            // Try to match by configurationId or display name
            const manualRef = sourceIssuer.credentialRefs.find(
              (r) => r.id === config.configurationId || r.displayName === config.displayName
            );
            if (manualRef) {
              config.credentialCatalogRef = { id: manualRef.id, displayName: manualRef.displayName };
            }
          }
        }
      }

      // Persist firstSeenAt
      if (!historyState[sourceIssuer.id]) {
        historyState[sourceIssuer.id] = { firstSeenAt: fetchedAt };
      }

      const updatedAt = gitDate || catalog.lastUpdated || fetchedAt;

      const aggregated: AggregatedIssuer = {
        id: sourceIssuer.id,
        organization,
        displayName: getIssuerDisplayName(metadata, sourceIssuer),
        environment: sourceIssuer.environment,
        credentialIssuerUrl: metadata.credential_issuer || sourceIssuer.oid4vciMetadataUrl.replace(
          '/.well-known/openid-credential-issuer', ''
        ),
        oid4vciMetadataUrl: sourceIssuer.oid4vciMetadataUrl,
        logoUri: getIssuerLogoUri(metadata, catalog.organization),
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
    totalOrganizations: new Set(allIssuers.map((i) => i.organization.name)).size,
    totalCredentialConfigurations: allIssuers.reduce(
      (sum, i) => sum + i.credentialConfigurations.length,
      0
    ),
  };

  const output: AggregatedIssuerCatalog = {
    schemaVersion: '1.0',
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
