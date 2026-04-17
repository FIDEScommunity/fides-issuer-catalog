import type { VercelRequest, VercelResponse } from "@vercel/node";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "FIDES Issuer Catalog API",
    version: "1.2.0",
    description:
      "Public API for querying OID4VCI issuers from the FIDES Issuer Catalog aggregated data.",
  },
  servers: [{ url: "/api/public" }],
  paths: {
    "/issuer": {
      get: {
        summary: "List issuers",
        operationId: "listIssuers",
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description:
              "Case-insensitive search across id, orgId, displayName, description, URLs, project context, organization name, and credential configuration fields",
          },
          {
            name: "environment",
            in: "query",
            schema: { type: "string" },
            description: "Exact match on issuer environment (e.g. test, production)",
          },
          {
            name: "orgId",
            in: "query",
            schema: { type: "string" },
            description: "Exact match on organization catalog id (e.g. org:animo)",
          },
          {
            name: "vcFormat",
            in: "query",
            schema: { type: "string" },
            description:
              "Filter issuers that expose at least one credential configuration with this vcFormat (e.g. sd_jwt_vc, mdoc, jwt_vc_json)",
          },
          {
            name: "credentialCatalogId",
            in: "query",
            schema: { type: "string" },
            description:
              "Exact match on FIDES credential catalog id: issuers that have at least one credential configuration linked to this id (credentialCatalogRef.id, e.g. cred:eu:pid-vc-sd-jwt:sd-jwt-vc)",
          },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["displayName", "environment", "id", "orgId", "updatedAt"],
              default: "displayName",
            },
          },
          {
            name: "direction",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
          },
          { name: "page", in: "query", schema: { type: "integer", default: 0 } },
          { name: "size", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": {
            description: "Paginated list of issuers (same shape as the Organization Catalog API)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    content: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Issuer" },
                    },
                    totalElements: { type: "integer" },
                    totalPages: { type: "integer" },
                    number: { type: "integer" },
                    size: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/issuer/{id}": {
      get: {
        summary: "Get issuer by id",
        operationId: "getIssuerById",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Issuer catalog id (URL-encoded when it contains reserved characters)",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Issuer",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Issuer" },
              },
            },
          },
          "404": {
            description: "Not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Issuer: {
        type: "object",
        description:
          "Issuer row from data/aggregated.json; additional crawler-enriched fields may be present.",
        additionalProperties: true,
        properties: {
          id: { type: "string" },
          orgId: { type: "string" },
          displayName: { type: "string" },
          environment: { type: "string" },
          description: { type: "string" },
          credentialIssuerUrl: { type: "string", format: "uri" },
          oid4vciMetadataUrl: { type: "string", format: "uri" },
          organization: { type: "object", additionalProperties: true },
          credentialConfigurations: { type: "array", items: { type: "object", additionalProperties: true } },
          updatedAt: { type: "string" },
        },
      },
    },
  },
};

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600");
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(spec);
}
