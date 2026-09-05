import type { DraftRole, GeneratedChampionGuide } from "../domain/lol-draft.types";

const OPGG_MCP_ENDPOINT = "https://mcp-api.op.gg/mcp";
const GUIDE_CACHE_TTL_MS = 10 * 60 * 1000;

type CachedGuide = {
  expiresAt: number;
  guide: GeneratedChampionGuide;
};

type McpResponse = {
  result?: {
    content?: Array<{ text?: string; type?: string }>;
  };
};

const guideCache = new Map<string, CachedGuide>();

function toMcpChampionName(championName: string) {
  return championName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(`[${value}]`) as unknown;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : null;
  } catch {
    return null;
  }
}

function runeShardLabel(statModIds: string) {
  const names: Record<number, string> = {
    5001: "Vida",
    5002: "Velocidad de movimiento",
    5003: "Vida",
    5005: "Velocidad de ataque",
    5007: "Aceleracion de habilidad",
    5008: "Fuerza adaptable",
    5010: "Velocidad de ataque",
    5011: "Vida por nivel",
    5013: "Tenacidad y resistencia a ralentizaciones",
  };

  return statModIds
    .split(",")
    .map((id) => names[Number(id.trim())])
    .filter((name): name is string => Boolean(name))
    .join(" · ") || "Fragmentos recomendados por OP.GG";
}

function parseGuide(content: string, championName: string, role: DraftRole): GeneratedChampionGuide | null {
  const items = content.match(/CoreItems\(\[([\s\S]*?)\],/)?.[1];
  const runes = content.match(/Runes\("([^"]+)",\[([\s\S]*?)\],"([^"]+)",\[([\s\S]*?)\],\[([^\]]*?)\]\)/);
  if (!items || !runes) return null;

  const build = parseStringArray(items);
  const primaryRunes = parseStringArray(runes[2]);
  const secondaryRunes = parseStringArray(runes[4]);
  if (!build || build.length === 0 || !primaryRunes || !secondaryRunes) return null;

  return {
    build: build.slice(0, 3),
    runes: {
      primary: [runes[1], ...primaryRunes].join(" · "),
      secondary: [runes[3], ...secondaryRunes].join(" · "),
      shards: runeShardLabel(runes[5]),
    },
    rationale: `Build y runas de mayor uso para ${championName} en ${role} segun los datos actuales de OP.GG.`,
  };
}

export async function getOpggChampionGuide(championName: string, role: DraftRole) {
  const cacheKey = `${toMcpChampionName(championName)}:${role}`;
  const cachedGuide = guideCache.get(cacheKey);
  if (cachedGuide && cachedGuide.expiresAt > Date.now()) return cachedGuide.guide;

  const response = await fetch(OPGG_MCP_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "MCP-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: cacheKey,
      method: "tools/call",
      params: {
        name: "lol_get_champion_analysis",
        arguments: {
          game_mode: "ranked",
          champion: toMcpChampionName(championName),
          position: role,
          lang: "es_ES",
          desired_output_fields: [
            "data.core_items.{ids_names[],pick_rate,win}",
            "data.runes.{primary_page_name,primary_rune_names[],secondary_page_name,secondary_rune_names[],stat_mod_names[]}",
          ],
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`OP.GG MCP respondio ${response.status}.`);

  const payload = (await response.json()) as McpResponse;
  const content = payload.result?.content
    ?.filter((entry) => entry.type === "text" && typeof entry.text === "string")
    .map((entry) => entry.text)
    .join("\n");
  const guide = content ? parseGuide(content, championName, role) : null;
  if (!guide) throw new Error("OP.GG no devolvio una guia interpretable.");

  guideCache.set(cacheKey, { guide, expiresAt: Date.now() + GUIDE_CACHE_TTL_MS });
  return guide;
}
