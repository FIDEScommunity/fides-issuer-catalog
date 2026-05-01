import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadIssuerData, type IssuerRow } from "../../lib/aggregatedData";

function toNumber(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isNaN(n) || n < 0 ? fallback : n;
}

function issuerVcFormats(i: IssuerRow): string[] {
  const cfgs = i.credentialConfigurations;
  if (!cfgs?.length) return [];
  return cfgs
    .map((c) => (typeof c.vcFormat === "string" ? c.vcFormat : ""))
    .filter(Boolean);
}

function issuerCredentialCatalogIds(i: IssuerRow): string[] {
  const cfgs = i.credentialConfigurations;
  if (!cfgs?.length) return [];
  const ids: string[] = [];
  for (const c of cfgs) {
    const id = c.credentialCatalogRef?.id;
    if (typeof id === "string" && id.length) ids.push(id);
  }
  return ids;
}

function issuerSubjectTypes(i: IssuerRow): string[] {
  const cfgs = i.credentialConfigurations;
  if (!cfgs?.length) return [];
  return cfgs
    .map((c) => (typeof c.subjectType === "string" ? c.subjectType : ""))
    .filter(Boolean);
}

function issuerTags(i: IssuerRow): string[] {
  const cfgs = i.credentialConfigurations;
  if (!cfgs?.length) return [];
  const tags: string[] = [];
  for (const c of cfgs) {
    if (!Array.isArray(c.tags)) continue;
    for (const t of c.tags) {
      if (typeof t === "string" && t.length) tags.push(t);
    }
  }
  return tags;
}

function searchHaystack(i: IssuerRow): string {
  const orgName = i.organization?.name ?? "";
  const orgCountry = i.organization?.country ?? "";
  const parts = [
    i.id,
    i.orgId,
    i.displayName,
    i.environment,
    i.issuanceProtocol ?? "",
    i.description ?? "",
    i.projectContext ?? "",
    i.issuerWebsiteUrl ?? "",
    i.oid4vciMetadataUrl ?? "",
    i.credentialIssuerUrl ?? "",
    orgName,
    orgCountry,
  ];
  for (const c of i.credentialConfigurations ?? []) {
    parts.push(
      c.displayName ?? "",
      c.vcFormat ?? "",
      c.subjectType ?? "",
      c.vct ?? "",
      c.docType ?? "",
      c.configurationId ?? "",
      c.credentialCatalogRef?.id ?? "",
    );
    if (Array.isArray(c.tags)) {
      for (const tag of c.tags) {
        if (typeof tag === "string") parts.push(tag);
      }
    }
  }
  return parts.join(" ").toLowerCase();
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    res.status(405).json({
      message: "Method not allowed",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const data = loadIssuerData();
  let list = [...data.issuers];

  const environment =
    typeof req.query.environment === "string" ? req.query.environment : undefined;
  const orgId =
    typeof req.query.orgId === "string" ? req.query.orgId : undefined;
  const vcFormat =
    typeof req.query.vcFormat === "string" ? req.query.vcFormat : undefined;
  const credentialCatalogId =
    typeof req.query.credentialCatalogId === "string" &&
    req.query.credentialCatalogId.length
      ? req.query.credentialCatalogId
      : undefined;
  const subjectType =
    typeof req.query.subjectType === "string" && req.query.subjectType.length
      ? req.query.subjectType.toLowerCase()
      : undefined;
  const tags =
    typeof req.query.tags === "string" && req.query.tags.length
      ? req.query.tags.toLowerCase()
      : undefined;
  const country =
    typeof req.query.country === "string" && req.query.country.length
      ? req.query.country.toUpperCase()
      : undefined;
  const search =
    typeof req.query.search === "string"
      ? req.query.search.toLowerCase()
      : undefined;

  if (environment) {
    list = list.filter((i) => i.environment === environment);
  }
  if (orgId) {
    list = list.filter((i) => i.orgId === orgId);
  }
  if (vcFormat) {
    list = list.filter((i) => issuerVcFormats(i).includes(vcFormat));
  }
  if (credentialCatalogId) {
    list = list.filter((i) =>
      issuerCredentialCatalogIds(i).includes(credentialCatalogId),
    );
  }
  if (subjectType) {
    list = list.filter((i) =>
      issuerSubjectTypes(i).some((value) => value.toLowerCase() === subjectType),
    );
  }
  if (tags) {
    list = list.filter((i) =>
      issuerTags(i).some((tag) => tag.toLowerCase().includes(tags)),
    );
  }
  if (country) {
    list = list.filter(
      (i) => (i.organization?.country ?? "").toUpperCase() === country,
    );
  }
  if (search) {
    list = list.filter((i) => searchHaystack(i).includes(search));
  }

  const sortField = typeof req.query.sort === "string" ? req.query.sort : "displayName";
  const sortDir = req.query.direction === "desc" ? -1 : 1;

  list.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "environment":
        cmp = a.environment.localeCompare(b.environment);
        break;
      case "id":
        cmp = a.id.localeCompare(b.id);
        break;
      case "orgId":
        cmp = a.orgId.localeCompare(b.orgId);
        break;
      case "updatedAt":
        cmp = (a.updatedAt ?? "").localeCompare(b.updatedAt ?? "");
        break;
      default:
        cmp = a.displayName.localeCompare(b.displayName);
    }
    return cmp * sortDir;
  });

  const page = toNumber(req.query.page, 0);
  const size = toNumber(req.query.size, 20);
  const start = page * size;
  const paged = list.slice(start, start + size);

  res.status(200).json({
    content: paged,
    totalElements: list.length,
    totalPages: Math.ceil(list.length / size) || 0,
    number: page,
    size,
  });
}
