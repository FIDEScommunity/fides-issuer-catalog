// Source types (what contributors write in community-catalogs/**/issuer-catalog.json)

export interface SourceWalletReference {
  id: string;
  displayName?: string;
}

export interface SourceCredentialReference {
  id: string;
  displayName?: string;
}

export interface SourceIssuer {
  id: string;
  displayName?: string;
  description?: string;
  environment: 'production' | 'test';
  issuanceProtocol: 'oid4vci' | 'other';
  oid4vciMetadataUrl?: string;
  /** Optional public URL for this issuer instance (e.g. web UI, demo, playground). */
  issuerWebsiteUrl?: string;
  projectContext?: string;
  supportedWallets?: SourceWalletReference[];
  credentialRefs?: SourceCredentialReference[];
}

export interface SourceIssuerCatalog {
  $schema: string;
  /** Organization catalog id; crawler resolves name/DID/website/logo from organization aggregated.json */
  orgId: string;
  issuers: SourceIssuer[];
  lastUpdated?: string;
}

// OID4VCI .well-known/openid-credential-issuer metadata types

export interface Oid4vciDisplay {
  name?: string;
  locale?: string;
  logo?: {
    uri?: string;
    alt_text?: string;
  };
  background_color?: string;
  text_color?: string;
}

export interface Oid4vciCredentialDisplay extends Oid4vciDisplay {
  background_image?: {
    uri?: string;
  };
}

export interface Oid4vciClaimDisplay {
  name?: string;
  locale?: string;
}

export interface Oid4vciClaim {
  mandatory?: boolean;
  value_type?: string;
  display?: Oid4vciClaimDisplay[];
}

export interface Oid4vciCredentialConfiguration {
  format: string;
  scope?: string;
  cryptographic_binding_methods_supported?: string[];
  credential_signing_alg_values_supported?: string[];
  proof_types_supported?: Record<string, { proof_signing_alg_values_supported?: string[] }>;
  display?: Oid4vciCredentialDisplay[];
  // SD-JWT VC
  vct?: string;
  claims?: Record<string, Oid4vciClaim>;
  // mdoc
  doctype?: string;
  // JWT VC
  type?: string[];
  // VCDM 2.0
  credential_definition?: {
    type?: string[];
    credentialSubject?: Record<string, Oid4vciClaim>;
  };
}

export interface Oid4vciMetadata {
  credential_issuer: string;
  credential_endpoint?: string;
  authorization_servers?: string[];
  display?: Oid4vciDisplay[];
  credential_configurations_supported?: Record<string, Oid4vciCredentialConfiguration>;
}

// Enriched / aggregated types (what ends up in data/aggregated.json)

export interface AggregatedCredentialCatalogRef {
  id: string;
  displayName?: string;
}

export interface AggregatedCredentialConfiguration {
  configurationId: string;
  displayName?: string;
  vcFormat: string;
  vct?: string;
  docType?: string;
  signingAlgorithms: string[];
  proofTypes: string[];
  cryptographicBindingMethods: string[];
  logoUri?: string;
  credentialCatalogRef?: AggregatedCredentialCatalogRef;
}

export interface AggregatedWalletRef {
  id: string;
  displayName?: string;
}

export interface AggregatedOrganization {
  name: string;
  did?: string;
  website?: string;
  logoUri?: string;
}

export interface AggregatedIssuer {
  id: string;
  orgId: string;
  organization: AggregatedOrganization;
  displayName: string;
  description?: string;
  environment: 'production' | 'test';
  issuanceProtocol: 'oid4vci' | 'other';
  credentialIssuerUrl: string;
  oid4vciMetadataUrl?: string;
  /** From source catalog when provided (e.g. issuer web UI or playground link). */
  issuerWebsiteUrl?: string;
  logoUri?: string;
  projectContext?: string;
  credentialConfigurations: AggregatedCredentialConfiguration[];
  supportedWallets: AggregatedWalletRef[];
  firstSeenAt: string;
  updatedAt: string;
  fetchedAt: string;
  metadataFetchError?: string;
}

export interface AggregatedStats {
  totalIssuers: number;
  productionIssuers: number;
  totalOrganizations: number;
  totalCredentialConfigurations: number;
}

export interface AggregatedIssuerCatalog {
  schemaVersion: string;
  catalogType: 'issuer-catalog';
  lastUpdated: string;
  issuers: AggregatedIssuer[];
  stats: AggregatedStats;
}

export interface IssuerHistoryState {
  [issuerId: string]: {
    firstSeenAt: string;
  };
}
