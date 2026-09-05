import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const endpoint = "https://mcp-api.op.gg/mcp";
const outputPath = resolve("src/features/lol-draft/data/opgg-top-meta.json");

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    "MCP-Protocol-Version": "2025-06-18",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "draftlens-top-snapshot",
    method: "tools/call",
    params: {
      name: "lol_list_lane_meta_champions",
      arguments: { game_mode: "ranked", position: "top", lang: "es_ES", desired_output_fields: [] },
    },
  }),
});

if (!response.ok) throw new Error(`OP.GG MCP respondio ${response.status}.`);

const payload = await response.json();
const content = payload.result?.content
  ?.filter((entry) => entry.type === "text")
  .map((entry) => entry.text)
  .join("\n") ?? "";

const pattern = /Top\("([^"]+)",(true|false),(\d+),(\d+),(\d+),([\d.]+),([\d.]+),([\d.]+),([\d.]+),([\d.]+),(\d+),(\d+),(\d+),(\d+)\)/g;
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

if (champions.length === 0) throw new Error("OP.GG no devolvio campeones de top interpretables.");

await mkdir(resolve("src/features/lol-draft/data"), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ source: "OP.GG MCP", role: "top", updatedAt: new Date().toISOString(), champions }, null, 2)}\n`);
console.log(`Snapshot de top actualizado: ${champions.length} campeones.`);
