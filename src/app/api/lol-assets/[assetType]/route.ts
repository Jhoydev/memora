import { NextRequest } from "next/server";
import type { LolAssetReference, LolAssetType } from "@/features/lol-draft/domain/lol-assets.types";
import { resolveDataDragonAsset } from "@/features/lol-draft/services/data-dragon-assets.service";

const assetTypes = new Set<LolAssetType>(["champion", "item", "rune", "spell", "ability", "passive"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getReference(type: LolAssetType, searchParams: URLSearchParams): LolAssetReference | null {
  const id = searchParams.get("id") ?? undefined;
  const key = searchParams.get("key") ?? undefined;
  const name = searchParams.get("name") ?? undefined;
  const image = searchParams.get("image") ?? undefined;
  const championId = searchParams.get("championId") ?? undefined;
  const championKey = searchParams.get("championKey") ?? undefined;
  const championName = searchParams.get("championName") ?? undefined;

  if (type === "champion" && (id || key || name)) return { id, key, name };
  if ((type === "item" || type === "rune") && (id || name)) return { id, name };
  if (type === "spell" && (id || name || image)) return { id, name, image };
  if (type === "ability" && (championId || championKey || championName) && (id || name || image)) {
    return { champion: { id: championId, key: championKey, name: championName }, id, name, image };
  }
  if (type === "passive" && image) return { image };

  return null;
}

type LolAssetRouteProps = {
  params: Promise<{ assetType: string }>;
};

export async function GET(request: NextRequest, { params }: LolAssetRouteProps) {
  const { assetType } = await params;
  if (!assetTypes.has(assetType as LolAssetType)) {
    return Response.json({ error: "Tipo de asset no soportado." }, { status: 404 });
  }

  const type = assetType as LolAssetType;
  const reference = getReference(type, request.nextUrl.searchParams);
  if (!reference) {
    return Response.json({ error: "Referencia de asset inválida." }, { status: 400 });
  }

  try {
    const assetUrl = await resolveDataDragonAsset(type, reference);
    if (!assetUrl) return Response.json({ error: "Asset no encontrado." }, { status: 404 });

    return Response.redirect(assetUrl, 307);
  } catch {
    return Response.json({ error: "No se pudo resolver el asset." }, { status: 502 });
  }
}
