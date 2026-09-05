import { getOpggChampionGuide } from "@/features/lol-draft/services/opgg-champion-guide.service";
import { getChampSelectSnapshot } from "@/features/lol-draft/services/lol-client.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const snapshot = await getChampSelectSnapshot();
  const role = snapshot.yourRole;
  const pick = role ? snapshot.alliedPicks[role] : null;

  if (snapshot.status !== "in-champ-select" || !role || !pick) {
    return Response.json({ error: "No hay un pick local activo." }, { status: 409 });
  }

  try {
    const guide = await getOpggChampionGuide(pick.championName, role);
    return Response.json({ guide });
  } catch {
    return Response.json({ error: "No se pudo consultar la guia de OP.GG." }, { status: 502 });
  }
}
