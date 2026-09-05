import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputPath = resolve("src/features/lol-draft/data/riot-champion-profiles.json");
const baseUrl = "https://ddragon.leagueoflegends.com";

function normalize(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

// These are intentionally broad, source-backed signals. Curated profiles remain
// responsible for kit-specific concepts such as engage, split or target access.
function tacticalTags(riotTags) {
  const tags = new Set();
  if (riotTags.includes("Tank")) tags.add("frontline");
  if (riotTags.includes("Mage")) tags.add("ap");
  if (riotTags.includes("Marksman")) {
    tags.add("ad");
    tags.add("sustain");
    tags.add("tank-shred");
  }
  if (riotTags.includes("Fighter")) {
    tags.add("ad");
    tags.add("sustain");
  }
  if (riotTags.includes("Assassin")) {
    tags.add("ad");
    tags.add("burst");
    tags.add("dive");
  }
  if (riotTags.includes("Support")) tags.add("peel");
  return [...tags];
}

const versions = await (await fetch(`${baseUrl}/api/versions.json`)).json();
const version = versions[0];
if (!version) throw new Error("Riot Data Dragon no devolvió una versión.");
const catalog = await (await fetch(`${baseUrl}/cdn/${version}/data/es_ES/champion.json`)).json();
const profiles = Object.values(catalog.data).reduce((result, champion) => {
  result[normalize(champion.name)] = {
    dataDragonId: champion.id,
    riotChampionKey: Number(champion.key),
    name: champion.name,
    riotTags: champion.tags,
    tags: tacticalTags(champion.tags),
  };
  return result;
}, {});

await mkdir(resolve("src/features/lol-draft/data"), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ source: "Riot Data Dragon", version, updatedAt: new Date().toISOString(), profiles }, null, 2)}\n`);
console.log(`Perfiles Riot actualizados: ${Object.keys(profiles).length} campeones para ${version}.`);
