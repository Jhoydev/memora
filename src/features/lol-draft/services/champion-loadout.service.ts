import type { Champion, ChampionLoadout, DraftBoard } from "../domain/lol-draft.types";
import { CHAMPIONS } from "./lol-draft-data";
import { getOpggLoadouts } from "./opgg-loadout.service";

export type SelectedLoadout = Pick<ChampionLoadout, "id" | "label" | "build" | "buildItems" | "starterItems" | "boots" | "runes" | "runeSelection" | "rationale"> & { score: number };

function enemyTags(enemyBoard: DraftBoard, unassignedEnemyChampionIds: string[] = []) {
  return new Set(
    [...Object.values(enemyBoard), ...unassignedEnemyChampionIds]
      .filter((championId): championId is string => Boolean(championId))
      .flatMap((championId) => CHAMPIONS.find((champion) => champion.id === championId)?.tags ?? []),
  );
}

export function getChampionLoadouts(
  champion: Champion,
  enemyBoard: DraftBoard,
  role = champion.roles[0],
  unassignedEnemyChampionIds: string[] = [],
): SelectedLoadout[] {
  const tags = enemyTags(enemyBoard, unassignedEnemyChampionIds);
  const curated = champion.loadouts ?? [{
    id: "standard",
    label: "Estándar",
    build: champion.build,
    buildItems: champion.buildItems,
    runes: champion.runes,
    runeSelection: champion.runeSelection,
    rationale: "Build y runas emparejadas para el plan de juego base del campeón.",
  }];
  const candidates = [...curated, ...(role ? getOpggLoadouts(champion, role) : [])];
  const ranked = candidates.map((loadout) => ({
    ...loadout,
    score: loadout.against && tags.has(loadout.against) ? 90 : loadout.against ? 65 : loadout.metaScore ?? 75,
  }));
  return ranked.sort((left, right) => right.score - left.score);
}

export function getChampionLoadout(
  champion: Champion,
  enemyBoard: DraftBoard,
  role = champion.roles[0],
  unassignedEnemyChampionIds: string[] = [],
): SelectedLoadout {
  return getChampionLoadouts(champion, enemyBoard, role, unassignedEnemyChampionIds)[0]!;
}
