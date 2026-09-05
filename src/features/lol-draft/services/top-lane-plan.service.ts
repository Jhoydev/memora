import type { Champion, ChampionTag, DraftBoard } from "../domain/lol-draft.types";
import { CHAMPIONS, EMPTY_DRAFT_BOARD } from "./lol-draft-data";
import { getChampionLoadouts, type SelectedLoadout } from "./champion-loadout.service";
import { getLaneMatchupAdvice } from "./lane-matchup-playbook.service";

export type TopLanePlan = {
  id: string;
  kind: "safe" | "conditional";
  opponent: Champion | null;
  loadout: SelectedLoadout;
  title: string;
  description: string;
};

// Imported profiles can lack tactical tags. Keep matchup knowledge explicit and expandable.
const TOP_LANE_THREAT_TAGS: Record<string, ChampionTag[]> = {
  darius: ["ad", "frontline", "sustain"],
  aurora: ["ap", "poke", "burst", "dive"],
};

function championsFromIds(championIds: string[]) {
  return [...new Set(championIds)]
    .map((championId) => CHAMPIONS.find((champion) => champion.id === championId))
    .filter((champion): champion is Champion => Boolean(champion));
}

function tacticalTags(champion: Champion) {
  return champion.tags.length > 0 ? champion.tags : TOP_LANE_THREAT_TAGS[champion.id] ?? [];
}

function loadoutForOpponent(champion: Champion, opponent: Champion) {
  const board: DraftBoard = { ...EMPTY_DRAFT_BOARD, top: opponent.id };
  const rankedLoadouts = getChampionLoadouts(champion, board, "top");
  const directResponse = champion.loadouts?.find(
    (loadout) => loadout.against && tacticalTags(opponent).includes(loadout.against),
  );
  const neutralPlan = champion.loadouts?.find((loadout) => !loadout.against);
  const intendedLoadout = directResponse ?? neutralPlan;
  return intendedLoadout
    ? rankedLoadouts.find((loadout) => loadout.id === intendedLoadout.id) ?? null
    : rankedLoadouts[0] ?? null;
}

export function getTopLanePlans(
  champion: Champion,
  detectedEnemyChampionIds: string[],
): TopLanePlan[] {
  if (!champion.roles.includes("top")) return [];

  const baselineLoadouts = getChampionLoadouts(champion, EMPTY_DRAFT_BOARD, "top");
  const neutralLoadout = champion.loadouts?.find((loadout) => !loadout.against);
  const safeLoadout = neutralLoadout
    ? baselineLoadouts.find((loadout) => loadout.id === neutralLoadout.id)
    : baselineLoadouts[0];
  if (!safeLoadout) return [];

  const safePlan: TopLanePlan = {
    id: `safe:${safeLoadout.id}`,
    kind: "safe",
    opponent: null,
    loadout: safeLoadout,
    title: "Plan seguro · rival de línea oculto",
    description: "No asume quién irá Top. Mantiene una build base útil para la composición hasta confirmar el matchup.",
  };

  const conditionalPlans = championsFromIds(detectedEnemyChampionIds)
    .filter((opponent) => opponent.roles.includes("top"))
    .flatMap((opponent) => {
      const loadout = loadoutForOpponent(champion, opponent);
      if (!loadout) return [];
      return [{
        id: `against:${opponent.id}:${loadout.id}`,
        kind: "conditional" as const,
        opponent,
        loadout,
        title: `Si ${opponent.name} va Top`,
        description: `${getLaneMatchupAdvice(champion.name, opponent.name).summary} Activa esta variante como hipótesis hasta confirmar la línea.`,
      }];
    });

  return [safePlan, ...conditionalPlans];
}
