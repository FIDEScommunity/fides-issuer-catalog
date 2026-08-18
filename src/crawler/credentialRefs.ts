import type {
  SourceCredentialReference,
  AggregatedCredentialConfiguration,
} from '../types/issuer.js';

interface CatalogEntry {
  id: string;
  displayName?: string;
  slug?: string;
  subjectType?: string;
  tags?: string[];
  nativeIdentifier?: string;
  nativeIdentifierType?: string;
  vcFormat?: string;
}

/** `cred:verana:cexa-kyc:sd-jwt-vc` → `cexa-kyc` */
export function catalogCredentialKey(id: string): string {
  const parts = String(id || '').split(':');
  return parts.length >= 4 ? parts[2] : '';
}

function normalize(value: string | undefined): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function vctTail(vct: string | undefined): string {
  const raw = String(vct || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const segment = url.pathname.split('/').filter(Boolean).pop() || '';
    return normalize(segment);
  } catch {
    return normalize(raw.split('/').filter(Boolean).pop());
  }
}

/** `verandia-legal-rep` ↔ `verandia-legal-representative` */
function prefixScore(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (!a.startsWith(b) && !b.startsWith(a)) return 0;
  return Math.min(a.length, b.length) / Math.max(a.length, b.length);
}

export function findRefForConfig(
  config: Pick<AggregatedCredentialConfiguration, 'configurationId' | 'displayName' | 'vct'>,
  refs: SourceCredentialReference[],
  usedRefIds: Set<string>
): SourceCredentialReference | undefined {
  const unused = refs.filter((ref) => ref.id && !usedRefIds.has(ref.id));
  if (!unused.length) return undefined;

  const configId = normalize(config.configurationId);
  const displayName = normalize(config.displayName);
  const vctKey = vctTail(config.vct);

  const scored = unused.find((ref) => {
    const key = normalize(catalogCredentialKey(ref.id));
    const refDisplay = normalize(ref.displayName);
    return (
      ref.id === config.configurationId ||
      (refDisplay && (refDisplay === displayName || refDisplay === configId)) ||
      (key && (key === configId || key === displayName || key === vctKey))
    );
  });
  if (scored) return scored;

  const prefixes = unused
    .map((ref) => {
      const key = normalize(catalogCredentialKey(ref.id));
      const score = Math.max(
        prefixScore(key, configId),
        prefixScore(key, displayName),
        prefixScore(key, vctKey)
      );
      return { ref, score };
    })
    .filter((row) => row.score >= 0.5)
    .sort((a, b) => b.score - a.score);
  if (prefixes.length === 1 || (prefixes.length > 1 && prefixes[0].score > prefixes[1].score)) {
    return prefixes[0].ref;
  }

  if (unused.length === 1) return unused[0];
  return undefined;
}

function catalogVcFormatToAggregated(fmt: string | undefined): string {
  if (!fmt) return 'unknown';
  if (fmt === 'mdoc' || fmt === 'sd_jwt_vc') return fmt;
  return fmt;
}

export function configurationsFromCredentialRefs(
  refs: SourceCredentialReference[],
  credentialEntries: CatalogEntry[]
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
      subjectType: catalogEntry?.subjectType,
      tags: catalogEntry?.tags,
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

/**
 * Attach source-catalog credentialRefs to OID4VCI configurations, then
 * append leftover refs (e.g. Linked-VP types on the same issuer).
 */
export function applyManualCredentialRefs(
  configs: AggregatedCredentialConfiguration[],
  refs: SourceCredentialReference[] | undefined,
  credentialEntries: CatalogEntry[]
): AggregatedCredentialConfiguration[] {
  if (!refs?.length) return configs;

  const usedRefIds = new Set<string>();
  for (const config of configs) {
    if (config.credentialCatalogRef?.id) {
      usedRefIds.add(config.credentialCatalogRef.id);
    }
  }

  for (const config of configs) {
    if (config.credentialCatalogRef) continue;
    const match = findRefForConfig(config, refs, usedRefIds);
    if (!match) continue;
    const catalogEntry = credentialEntries.find((entry) => entry.id === match.id);
    config.credentialCatalogRef = {
      id: match.id,
      displayName: match.displayName || catalogEntry?.displayName,
    };
    if (catalogEntry?.subjectType && !config.subjectType) {
      config.subjectType = catalogEntry.subjectType;
    }
    if (catalogEntry?.tags && !config.tags) {
      config.tags = catalogEntry.tags;
    }
    usedRefIds.add(match.id);
  }

  const leftover = refs.filter((ref) => ref.id && !usedRefIds.has(ref.id));
  if (!leftover.length) return configs;
  return [...configs, ...configurationsFromCredentialRefs(leftover, credentialEntries)];
}
