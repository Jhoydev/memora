import type { NextRequest } from "next/server";
import type { LolAssetType } from "@/features/lol-draft/domain/lol-assets.types";

const fallbackLabels: Record<LolAssetType, string> = {
  champion: "C",
  item: "I",
  rune: "R",
  spell: "S",
  ability: "Q",
  passive: "P",
};

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const requestedType = request.nextUrl.searchParams.get("type") as LolAssetType;
  const label = fallbackLabels[requestedType] ?? "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Asset no disponible"><rect width="64" height="64" rx="14" fill="#e2e8f0"/><path d="M20 20h24v24H20z" fill="#cbd5e1"/><text x="32" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#64748b">${label}</text></svg>`;

  return new Response(svg, {
    headers: {
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
