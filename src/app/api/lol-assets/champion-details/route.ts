import type { NextRequest } from "next/server";
import type { LolChampionReference } from "@/features/lol-draft/domain/lol-assets.types";
import { getDataDragonChampionProfile } from "@/features/lol-draft/services/data-dragon-assets.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const reference: LolChampionReference = {
    id: request.nextUrl.searchParams.get("id") ?? undefined,
    key: request.nextUrl.searchParams.get("key") ?? undefined,
    name: request.nextUrl.searchParams.get("name") ?? undefined,
  };

  if (!reference.id && !reference.key && !reference.name) {
    return Response.json({ error: "Campeón inválido." }, { status: 400 });
  }

  try {
    const profile = await getDataDragonChampionProfile(reference);
    return Response.json({
      abilities: profile?.abilities ?? [],
      identity: profile?.identity ?? null,
      passive: profile?.passive ?? null,
    });
  } catch {
    return Response.json({ abilities: [], identity: null, passive: null }, { status: 502 });
  }
}
