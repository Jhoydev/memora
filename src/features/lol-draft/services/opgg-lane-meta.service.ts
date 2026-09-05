import type { DraftRole } from "../domain/lol-draft.types";
import laneMetaSnapshot from "../data/opgg-lane-meta.json";

export type LaneMetaChampion = {
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

export function getLaneMetaChampion(role: DraftRole, name: string | null | undefined) {
  if (!name) return null;
  const champions = laneMetaSnapshot.roles[role] as LaneMetaChampion[] | undefined;
  return champions?.find((champion) => normalizeChampionName(champion.name) === normalizeChampionName(name)) ?? null;
}

export function getLaneMetaAdjustment(role: DraftRole, name: string) {
  const champion = getLaneMetaChampion(role, name);
  if (!champion || champion.isRip) return 0;
  if (champion.tier === 1) return 10;
  if (champion.tier === 2) return 6;
  if (champion.tier === 3) return 3;
  return 0;
}
