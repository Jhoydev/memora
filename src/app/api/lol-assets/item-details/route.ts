import { NextRequest } from "next/server";
import type { LeagueItemReference } from "@/features/lol-draft/domain/lol-draft.types";
import { getDataDragonItemPurchaseDetails } from "@/features/lol-draft/services/data-dragon-assets.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseReferences(value: string | null): LeagueItemReference[] | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 10) return null;

    const references = parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as { id?: unknown; name?: unknown };
      if (typeof candidate.name !== "string" || candidate.name.length > 120) return [];
      return [{
        id: typeof candidate.id === "number" && Number.isFinite(candidate.id) ? candidate.id : undefined,
        name: candidate.name,
      } satisfies LeagueItemReference];
    });

    return references.length === parsed.length ? references : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const references = parseReferences(request.nextUrl.searchParams.get("items"));
  if (!references) return Response.json({ error: "Objetos inválidos." }, { status: 400 });

  try {
    return Response.json({ items: await getDataDragonItemPurchaseDetails(references) });
  } catch {
    return Response.json({ error: "No se pudieron resolver las recetas de objetos." }, { status: 502 });
  }
}
