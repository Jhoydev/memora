import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const endpoint = "https://mcp-api.op.gg/mcp";
const metaPath = resolve("src/features/lol-draft/data/opgg-lane-meta.json");
const outputPath = resolve("src/features/lol-draft/data/opgg-top-champions.json");
const meta = JSON.parse(await readFile(metaPath, "utf8"));
const champions = (meta.roles?.top ?? []).filter((champion) => !champion.isRip).map((champion) => champion.name);
let analyses = [];

try {
  const existing = JSON.parse(await readFile(outputPath, "utf8"));
  analyses = Array.isArray(existing.analyses) ? existing.analyses : [];
} catch {
  // The first sync starts with an empty cache.
}

const desiredOutputFields = [
  "data.starter_items.{ids_names[],pick_rate,play,win}",
  "data.boots.{ids_names[],pick_rate,play,win}",
  "data.core_items.{ids_names[],pick_rate,play,win}",
  "data.fourth_items[].{ids_names[],pick_rate,play,win}",
  "data.fifth_items[].{ids_names[],pick_rate,play,win}",
  "data.last_items[].{ids_names[],pick_rate,play,win}",
  "data.runes.{primary_page_name,primary_rune_names[],secondary_page_name,secondary_rune_names[],stat_mod_names[],pick_rate,play,win}",
  "data.strong_counters[].{champion_name,my_win_rate,counter_win_rate,play}",
  "data.weak_counters[].{champion_name,my_win_rate,counter_win_rate,play}",
  "data.summary.average_stats.{win_rate,pick_rate,ban_rate,tier,rank,kda}",
];

function toMcpChampionName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

async function fetchChampion(name) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/json, text/event-stream", "Content-Type": "application/json", "MCP-Protocol-Version": "2025-06-18" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `draftlens-top-${toMcpChampionName(name)}`,
      method: "tools/call",
      params: { name: "lol_get_champion_analysis", arguments: { game_mode: "ranked", champion: toMcpChampionName(name), position: "top", lang: "es_ES", desired_output_fields: desiredOutputFields } },
    }),
  });
  if (!response.ok) throw new Error(`${name}: OP.GG respondió ${response.status}.`);

  const payload = await response.json();
  const content = payload.result?.content?.filter((entry) => entry.type === "text").map((entry) => entry.text).join("\n") ?? "";
  return { champion: toMcpChampionName(name), position: "top", content };
}

const completed = new Set(analyses.map((analysis) => analysis.champion));
const missingChampions = champions.filter((champion) => !completed.has(toMcpChampionName(champion)));

async function writeSnapshot() {
  await mkdir(resolve("src/features/lol-draft/data"), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ source: "OP.GG MCP", updatedAt: new Date().toISOString(), analyses }, null, 2)}\n`);
}

for (let index = 0; index < missingChampions.length; index += 2) {
  analyses.push(...await Promise.all(missingChampions.slice(index, index + 2).map(fetchChampion)));
  await writeSnapshot();
  console.log(`Top sincronizado: ${completed.size + Math.min(index + 2, missingChampions.length)}/${champions.length}`);
}

console.log(`Top completo: ${analyses.length} perfiles.`);
