import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const endpoint = "https://mcp-api.op.gg/mcp";
const outputPath = resolve("src/features/lol-draft/data/opgg-champion-pool.json");
const pool = [
  ["GNAR", "top"], ["MALPHITE", "top"], ["SETT", "top"], ["AURELION_SOL", "top"], ["K_SANTE", "top"], ["POPPY", "top"], ["GALIO", "top"], ["ZAAHEN", "top"],
  ["NOCTURNE", "jungle"], ["MALPHITE", "jungle"], ["SHYVANA", "jungle"], ["EVELYNN", "jungle"],
  ["JINX", "adc"], ["LUCIAN", "adc"], ["SIVIR", "adc"], ["SAMIRA", "adc"],
  ["BRAUM", "support"], ["JANNA", "support"], ["MILIO", "support"], ["ZILEAN", "support"],
];

async function fetchChampion([champion, position]) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/json, text/event-stream", "Content-Type": "application/json", "MCP-Protocol-Version": "2025-06-18" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `draftlens-${champion}-${position}`,
      method: "tools/call",
      params: {
        name: "lol_get_champion_analysis",
        arguments: {
          game_mode: "ranked",
          champion,
          position,
          lang: "es_ES",
          desired_output_fields: [
            "data.starter_items.{ids_names[],pick_rate,play,win}",
            "data.boots.{ids_names[],pick_rate,play,win}",
            "data.core_items.{ids_names[],pick_rate,play,win}",
            "data.fourth_items[].{ids_names[],pick_rate,play,win}",
            "data.fifth_items[].{ids_names[],pick_rate,play,win}",
            "data.last_items[].{ids_names[],pick_rate,play,win}",
            "data.runes.{primary_page_name,primary_rune_names[],secondary_page_name,secondary_rune_names[],stat_mod_names[],pick_rate,play,win}",
            "data.summary.average_stats.{win_rate,pick_rate,ban_rate,tier,rank,kda}",
            "data.strong_counters[].{champion_name,my_win_rate,counter_win_rate,play}",
            "data.weak_counters[].{champion_name,my_win_rate,counter_win_rate,play}",
            "data.synergies.top[].{champion_name,synergy_champion_name,win_rate,play}",
            "data.synergies.jungle[].{champion_name,synergy_champion_name,win_rate,play}",
            "data.synergies.mid[].{champion_name,synergy_champion_name,win_rate,play}",
            "data.synergies.adc[].{champion_name,synergy_champion_name,win_rate,play}",
            "data.synergies.support[].{champion_name,synergy_champion_name,win_rate,play}",
          ],
        },
      },
    }),
  });

  if (!response.ok) throw new Error(`${champion} ${position}: OP.GG respondio ${response.status}.`);
  const payload = await response.json();
  const content = payload.result?.content?.filter((entry) => entry.type === "text").map((entry) => entry.text).join("\n") ?? "";
  return { champion, position, content };
}

const analyses = [];
for (let index = 0; index < pool.length; index += 2) {
  analyses.push(...await Promise.all(pool.slice(index, index + 2).map(fetchChampion)));
}

await mkdir(resolve("src/features/lol-draft/data"), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ source: "OP.GG MCP", updatedAt: new Date().toISOString(), analyses }, null, 2)}\n`);
console.log(`Pool analizado: ${analyses.length} perfiles de campeón y línea.`);
