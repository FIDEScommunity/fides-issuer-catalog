import fs from "fs";
import path from "path";

export interface CredentialConfiguration {
  configurationId?: string;
  displayName?: string;
  vcFormat?: string;
  vct?: string;
  docType?: string;
}

export interface IssuerRow {
  id: string;
  orgId: string;
  displayName: string;
  environment: string;
  description?: string;
  projectContext?: string;
  issuerWebsiteUrl?: string;
  oid4vciMetadataUrl?: string;
  credentialIssuerUrl?: string;
  organization?: { name?: string; website?: string };
  credentialConfigurations?: CredentialConfiguration[];
  updatedAt?: string;
}

export interface AggregatedData {
  issuers: IssuerRow[];
}

let dataCache: AggregatedData | null = null;
let lastLoad = 0;
const CACHE_TTL_MS = 60_000;

export function loadIssuerData(): AggregatedData {
  const now = Date.now();
  if (dataCache && now - lastLoad < CACHE_TTL_MS) return dataCache;
  const raw = fs.readFileSync(
    path.join(process.cwd(), "data", "aggregated.json"),
    "utf-8",
  );
  const parsed = JSON.parse(raw) as { issuers?: IssuerRow[] };
  dataCache = { issuers: parsed.issuers ?? [] };
  lastLoad = now;
  return dataCache;
}
