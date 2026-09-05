import { getLiveGameSnapshot } from "@/features/lol-draft/services/lol-client.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json(await getLiveGameSnapshot());
}
