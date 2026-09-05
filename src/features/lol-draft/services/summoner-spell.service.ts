import type { Champion, ChampionTag, DraftBoard, DraftRole, SummonerSpellReference } from "../domain/lol-draft.types";
import { CHAMPIONS } from "./lol-draft-data";

export type SummonerSpellRecommendation = { spells: [SummonerSpellReference, SummonerSpellReference]; reason: string };

const SPELLS = {
  flash: { id: "SummonerFlash", name: "Destello" },
  smite: { id: "SummonerSmite", name: "Aplastar" },
  exhaust: { id: "SummonerExhaust", name: "Extenuación" },
  ignite: { id: "SummonerDot", name: "Incendiar" },
  cleanse: { id: "SummonerBoost", name: "Limpiar" },
  barrier: { id: "SummonerBarrier", name: "Barrera" },
  teleport: { id: "SummonerTeleport", name: "Teletransportar" },
  ghost: { id: "SummonerHaste", name: "Fantasma" },
} as const satisfies Record<string, SummonerSpellReference>;

function enemiesHave(board: DraftBoard, tag: ChampionTag, unassignedEnemyChampionIds: string[] = []) {
  return [...Object.values(board), ...unassignedEnemyChampionIds]
    .filter((championId): championId is string => Boolean(championId))
    .map((championId) => CHAMPIONS.find((champion) => champion.id === championId))
    .filter((champion): champion is Champion => Boolean(champion))
    .some((champion) => champion.tags.includes(tag));
}

export function getSummonerSpellRecommendation(
  role: DraftRole,
  enemyBoard: DraftBoard,
  unassignedEnemyChampionIds: string[] = [],
): SummonerSpellRecommendation {
  const hasDive = enemiesHave(enemyBoard, "dive", unassignedEnemyChampionIds) || enemiesHave(enemyBoard, "burst", unassignedEnemyChampionIds);
  const hasPick = enemiesHave(enemyBoard, "pick", unassignedEnemyChampionIds);
  const hasSustain = enemiesHave(enemyBoard, "sustain", unassignedEnemyChampionIds);

  if (role === "jungle") return { spells: [SPELLS.flash, SPELLS.smite], reason: "Aplastar es imprescindible para objetivos y control de la jungla." };
  if (role === "support" && hasDive) return { spells: [SPELLS.flash, SPELLS.exhaust], reason: "Extenuación reduce el all-in de asesinos y dive rival." };
  if (role === "support" && hasSustain) return { spells: [SPELLS.flash, SPELLS.ignite], reason: "Incendiar ayuda a cortar curación y asegurar ejecuciones." };
  if (role === "adc" && hasPick) return { spells: [SPELLS.flash, SPELLS.cleanse], reason: "Limpiar ofrece una respuesta adicional contra picks y control." };
  if ((role === "top" || role === "mid") && hasSustain) return { spells: [SPELLS.flash, SPELLS.ignite], reason: "Incendiar presiona contra curación y peleas largas." };
  if ((role === "top" || role === "mid") && hasDive) return { spells: [SPELLS.flash, SPELLS.barrier], reason: "Barrera mejora la supervivencia contra burst y dive." };

  const baseline: Record<Exclude<DraftRole, "jungle">, [SummonerSpellReference, SummonerSpellReference]> = {
    top: [SPELLS.flash, SPELLS.teleport], mid: [SPELLS.flash, SPELLS.teleport], adc: [SPELLS.flash, SPELLS.ghost], support: [SPELLS.flash, SPELLS.ignite],
  };
  return { spells: baseline[role], reason: "Configuración estándar para mantener presencia en el mapa." };
}
