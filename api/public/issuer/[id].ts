/**
 * GET /api/public/issuer/:id
 * Returns one issuer by catalog id. Encode reserved characters in the path when needed.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadIssuerData } from "../../../lib/aggregatedData";

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

  const idRaw = req.query.id;
  const idParam = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  if (typeof idParam !== "string" || !idParam.length) {
    res.status(400).json({
      message: "Missing issuer id",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  let id: string;
  try {
    id = decodeURIComponent(idParam);
  } catch {
    res.status(400).json({
      message: "Invalid issuer id encoding",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const data = loadIssuerData();
  const issuer = data.issuers.find((i) => i.id === id);

  if (!issuer) {
    res.status(404).json({
      message: "Issuer not found",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json(issuer);
}
