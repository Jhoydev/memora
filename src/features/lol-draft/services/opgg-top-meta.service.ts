import topMetaSnapshot from "../data/opgg-top-meta.json";

export type TopMetaChampion = {
  name: string;
  isRip: boolean;
  play: number;
  win: number;
  winRate: number;
  pickRate: number;
  roleRate: number;
  banRate: number;
  kda: number;
  tier: number;
  rank: number;
  previousRank: number;
  previousPatchRank: number;
};

function normalizeChampionName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function getTopMetaChampion(name: string | null | undefined) {
  if (!name) return null;
  return (topMetaSnapshot.champions as TopMetaChampion[]).find(
    (champion) => normalizeChampionName(champion.name) === normalizeChampionName(name),
  ) ?? null;
}

export function getTopMetaAdjustment(name: string) {
  const champion = getTopMetaChampion(name);
  if (!champion || champion.isRip) return 0;
  if (champion.tier === 1) return 10;
  if (champion.tier === 2) return 6;
  if (champion.tier === 3) return 3;
  return 0;
}
