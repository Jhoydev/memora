import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const endpoint = "https://mcp-api.op.gg/mcp";
const outputPath = resolve("src/features/lol-draft/data/opgg-lane-meta.json");
const roles = ["top", "jungle", "mid", "adc", "support"];

async function fetchRole(role) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "MCP-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `draftlens-${role}-snapshot`,
      method: "tools/call",
      params: {
        name: "lol_list_lane_meta_champions",
        arguments: { game_mode: "ranked", position: role, lang: "es_ES", desired_output_fields: [] },
      },
    }),
  });

  if (!response.ok) throw new Error(`OP.GG MCP respondio ${response.status} para ${role}.`);

  const payload = await response.json();
  const content = payload.result?.content
    ?.filter((entry) => entry.type === "text")
    .map((entry) => entry.text)
    .join("\n") ?? "";
  const pattern = /(?:Top|Jungle|Mid|Adc|Support)\("([^"]+)",(true|false),(\d+),(\d+),(\d+),([\d.]+),([\d.]+),([\d.]+),([\d.]+),([\d.]+),(\d+),(\d+),(\d+),(\d+)\)/g;
  const champions = [...content.matchAll(pattern)].map((match) => ({
    name: match[1],
    isRip: match[2] === "true",
    play: Number(match[3]),
    win: Number(match[4]),
    winRate: Number(match[6]),
    pickRate: Number(match[7]),
    roleRate: Number(match[8]),
    banRate: Number(match[9]),
    kda: Number(match[10]),
    tier: Number(match[11]),
    rank: Number(match[12]),
    previousRank: Number(match[13]),
    previousPatchRank: Number(match[14]),
  }));

  if (champions.length === 0) throw new Error(`OP.GG no devolvio campeones de ${role} interpretables.`);
  return [role, champions];
}

// Dos consultas en paralelo aceleran el barrido sin saturar el endpoint publico.
const entries = [];
for (let index = 0; index < roles.length; index += 2) {
  entries.push(...await Promise.all(roles.slice(index, index + 2).map(fetchRole)));
}

await mkdir(resolve("src/features/lol-draft/data"), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ source: "OP.GG MCP", updatedAt: new Date().toISOString(), roles: Object.fromEntries(entries) }, null, 2)}\n`);
console.log(`Snapshot de meta actualizado: ${entries.map(([role, champions]) => `${role} (${champions.length})`).join(", ")}.`);
