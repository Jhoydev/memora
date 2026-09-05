import type { Champion, ChampionLoadout, DraftRole, RuneSelection } from "../domain/lol-draft.types";
import poolSnapshot from "../data/opgg-champion-pool.json";
import topSnapshot from "../data/opgg-top-champions.json";
import allChampionsSnapshot from "../data/opgg-all-champions.json";

type SnapshotAnalysis = {
  champion: string;
  position: DraftRole;
  content: string;
};

type OpggItemSet = {
  items: string[];
  pickRate: number;
  play: number;
  win: number;
};

type OpggRuneSet = {
  runes: Champion["runes"];
  runeSelection: RuneSelection;
  pickRate: number;
  play: number;
  win: number;
};

function normalizeChampionName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function uniqueBuildItems(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeChampionName(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function loadoutSignature(loadout: ChampionLoadout) {
  return [
    loadout.build.map(normalizeChampionName).join(":"),
    normalizeChampionName(loadout.runes.primary),
    normalizeChampionName(loadout.runes.secondary),
    normalizeChampionName(loadout.runes.shards),
  ].join("|");
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : null;
  } catch {
    return null;
  }
}

function splitTopLevel(value: string) {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quoted = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!;
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }

    if (character === '"') quoted = true;
    else if (character === "(" || character === "[") depth += 1;
    else if (character === ")" || character === "]") depth -= 1;
    else if (character === "," && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(value.slice(start));
  return parts.map((part) => part.trim());
}

function parseItemSet(value: string): OpggItemSet | null {
  const match = value.match(/^CoreItems\((\[[\s\S]*\]),(\d+),(\d+),([\d.]+)\)$/);
  if (!match) return null;

  const items = parseStringArray(match[1]!);
  if (!items?.length) return null;

  return { items, play: Number(match[2]), win: Number(match[3]), pickRate: Number(match[4]) };
}

function parseItemSetList(value: string) {
  if (!value.startsWith("[") || !value.endsWith("]")) return [];
  return splitTopLevel(value.slice(1, -1)).flatMap((item) => {
    const itemSet = parseItemSet(item);
    return itemSet ? [itemSet] : [];
  });
}

function runeShardLabel(statModIds: string) {
  const names: Record<number, string> = {
    5001: "Vida",
    5002: "Velocidad de movimiento",
    5003: "Vida",
    5005: "Velocidad de ataque",
    5007: "Aceleración de habilidad",
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

function parseRunes(value: string): OpggRuneSet | null {
  const match = value.match(/^Runes\("([^"]+)",(\[[\s\S]*\]),"([^"]+)",(\[[\s\S]*\]),\[([^\]]*)\],(\d+),(\d+),([\d.]+)\)$/);
  if (!match) return null;

  const primaryRunes = parseStringArray(match[2]!);
  const secondaryRunes = parseStringArray(match[4]!);
  if (!primaryRunes || !secondaryRunes) return null;

  return {
    runes: {
      primary: [match[1], ...primaryRunes].join(" · "),
      secondary: [match[3], ...secondaryRunes].join(" · "),
      shards: runeShardLabel(match[5]!),
    },
    runeSelection: {
      primaryTree: { name: match[1]! },
      primaryRunes: primaryRunes.map((name) => ({ name })),
      secondaryTree: { name: match[3]! },
      secondaryRunes: secondaryRunes.map((name) => ({ name })),
      shardIds: match[5]!.split(",").map((id) => Number(id.trim())).filter(Number.isFinite),
    },
    play: Number(match[6]),
    win: Number(match[7]),
    pickRate: Number(match[8]),
  };
}

function getDataArguments(content: string) {
  const prefix = "LolGetChampionAnalysis(Data(";
  const start = content.indexOf(prefix);
  if (start < 0) return [];

  const bodyStart = start + prefix.length;
  let depth = 1;
  let quoted = false;
  let escaped = false;

  for (let index = bodyStart; index < content.length; index += 1) {
    const character = content[index]!;
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }

    if (character === '"') quoted = true;
    else if (character === "(") depth += 1;
    else if (character === ")") {
      depth -= 1;
      if (depth === 0) return splitTopLevel(content.slice(bodyStart, index));
    }
  }

  return [];
}

function getMetaScore(itemSet: OpggItemSet) {
  const winRate = itemSet.play ? itemSet.win / itemSet.play : 0.5;
  return Math.max(60, Math.min(88, Math.round(68 + itemSet.pickRate * 20 + (winRate - 0.5) * 100)));
}

function toLoadout(
  id: string,
  label: string,
  build: string[],
  runes: OpggRuneSet,
  itemSet: OpggItemSet,
  rationale: string,
  starterItems?: string[],
  boots?: string[],
): ChampionLoadout {
  const uniqueBuild = uniqueBuildItems(build);
  return {
    id,
    label,
    build: uniqueBuild,
    buildItems: uniqueBuild.map((name) => ({ name })),
    starterItems: starterItems?.map((name) => ({ name })),
    boots: boots?.map((name) => ({ name })),
    runes: runes.runes,
    runeSelection: runes.runeSelection,
    metaScore: getMetaScore(itemSet),
    rationale,
  };
}

export function parseOpggLoadouts(content: string, role: DraftRole): ChampionLoadout[] {
  const dataArguments = getDataArguments(content);
  const itemSets = dataArguments.map(parseItemSet).filter((itemSet): itemSet is OpggItemSet => Boolean(itemSet));
  const [core, boots, starter] = itemSets;
  const runes = dataArguments.map(parseRunes).find((runeSet): runeSet is OpggRuneSet => Boolean(runeSet)) ?? null;
  if (!core || !runes) return [];

  // The payload can prepend summary, counters and synergies, so identify item lists by shape.
  const itemLists = dataArguments
    .map(parseItemSetList)
    .filter((itemSets) => itemSets.length > 0);
  const [, fourthItems = [], fifthItems = []] = itemLists;

  const base = toLoadout(
    `opgg-${role}-core`,
    "Meta OP.GG · core",
    core.items,
    runes,
    core,
    `Core build y runas más jugadas en OP.GG (${Math.round(core.pickRate * 100)}% de uso).`,
    starter?.items,
    boots?.items,
  );
  const extensions = [
    ...fourthItems.slice(0, 2),
    ...fifthItems.slice(0, 1),
  ];

  const loadouts = [base, ...extensions.map((itemSet, index) => toLoadout(
    `opgg-${role}-extension-${index + 1}`,
    `Meta OP.GG · ${index < 2 ? "4º" : "5º"} objeto`,
    [...core.items, ...itemSet.items],
    runes,
    itemSet,
    `Alternativa de continuación de OP.GG con ${Math.round(itemSet.pickRate * 100)}% de uso. Usa las mismas runas verificadas para este campeón y línea.`,
    starter?.items,
    boots?.items,
  ))];

  // A continuation can repeat an item already in the core. Once normalized, it
  // is not a different tactical decision and must not compete as an alternative.
  const seenSignatures = new Set<string>();
  return loadouts.filter((loadout) => {
    const signature = loadoutSignature(loadout);
    if (seenSignatures.has(signature)) return false;
    seenSignatures.add(signature);
    return true;
  });
}

export function getOpggLoadouts(champion: Champion, role: DraftRole) {
  // The detailed all-lanes snapshot takes precedence; legacy snapshots remain a fallback.
  const analyses = [
    ...(allChampionsSnapshot.analyses ?? []),
    ...(poolSnapshot.analyses ?? []),
    ...(topSnapshot.analyses ?? []),
  ] as SnapshotAnalysis[];
  const analysis = analyses.find((entry) => (
    entry.position === role && normalizeChampionName(entry.champion) === normalizeChampionName(champion.name)
  ));

  return analysis ? parseOpggLoadouts(analysis.content, role) : [];
}
