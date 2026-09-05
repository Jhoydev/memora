import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const endpoint = "https://mcp-api.op.gg/mcp";
const metaPath = resolve("src/features/lol-draft/data/opgg-lane-meta.json");
const outputPath = resolve("src/features/lol-draft/data/opgg-all-champions.json");
const meta = JSON.parse(await readFile(metaPath, "utf8"));
const roles = ["top", "jungle", "mid", "adc", "support"];
const maxImportsPerRun = 64;
const concurrentRequests = 8;
let analyses = [];

try {
  const existing = JSON.parse(await readFile(outputPath, "utf8"));
  analyses = Array.isArray(existing.analyses) ? existing.analyses : [];
} catch {
  // A missing file starts an incremental snapshot from zero.
}

function analysisKey(analysis) {
  return `${analysis.champion}:${analysis.position}`;
}

// A terminated concurrent batch can have already flushed overlapping results.
analyses = [...new Map(analyses.map((analysis) => [analysisKey(analysis), analysis])).values()];

function toMcpChampionName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
}

const desiredOutputFields = [
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
];

const rawCandidates = roles.flatMap((position) => (meta.roles?.[position] ?? [])
  .filter((champion) => !champion.isRip)
  .map((champion) => ({ champion: toMcpChampionName(champion.name), position })));
const candidates = [...new Map(rawCandidates.map((candidate) => [`${candidate.champion}:${candidate.position}`, candidate])).values()];
const completed = new Set(analyses.map(analysisKey));
const pending = candidates.filter(({ champion, position }) => !completed.has(`${champion}:${position}`));
const batch = pending.slice(0, maxImportsPerRun);

async function fetchChampion({ champion, position }) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/json, text/event-stream", "Content-Type": "application/json", "MCP-Protocol-Version": "2025-06-18" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `draftlens-${champion}-${position}`,
      method: "tools/call",
      params: { name: "lol_get_champion_analysis", arguments: { game_mode: "ranked", champion, position, lang: "es_ES", desired_output_fields: desiredOutputFields } },
    }),
  });
  if (!response.ok) throw new Error(`${champion} ${position}: OP.GG respondió ${response.status}.`);

  const payload = await response.json();
  const content = payload.result?.content?.filter((entry) => entry.type === "text").map((entry) => entry.text).join("\n") ?? "";
  return { champion, position, content };
}

async function writeSnapshot() {
  analyses = [...new Map(analyses.map((analysis) => [analysisKey(analysis), analysis])).values()];
  await mkdir(resolve("src/features/lol-draft/data"), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ source: "OP.GG MCP", updatedAt: new Date().toISOString(), analyses }, null, 2)}\n`);
}

for (let index = 0; index < batch.length; index += concurrentRequests) {
  analyses.push(...await Promise.all(batch.slice(index, index + concurrentRequests).map(fetchChampion)));
  await writeSnapshot();
  console.log(`Dataset completo: ${Math.min(completed.size + index + concurrentRequests, candidates.length)}/${candidates.length}`);
}

await writeSnapshot();
console.log(
  pending.length > batch.length
    ? `Lote completado. Ejecuta de nuevo para continuar: ${analyses.length}/${candidates.length}.`
    : `Dataset completo: ${analyses.length} perfiles de campeón y línea.`,
);
