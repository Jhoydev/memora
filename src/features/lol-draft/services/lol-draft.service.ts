import type {
  Champion,
  ChampionRecommendation,
  ChampionTag,
  DamageProfile,
  DraftBoard,
  DraftRole,
  RecommendationFactor,
  RecommendationScope,
} from "../domain/lol-draft.types";
import { CHAMPIONS } from "./lol-draft-data";
import { getLaneMetaAdjustment } from "./opgg-lane-meta.service";
import { getTopMatchupAdjustment } from "./opgg-top-matchup.service";

type Capability = "frontline" | "engage" | "peel" | "cc" | "burst" | "sustained-damage" | "poke" | "wave-clear" | "dive" | "target-access" | "side-lane" | "split-push" | "objective-control" | "disengage";

const TAG_CAPABILITIES: Record<ChampionTag, Capability[]> = {
  ad: [], ap: [],
  frontline: ["frontline", "cc", "objective-control"],
  engage: ["engage", "cc"],
  peel: ["peel", "disengage"],
  poke: ["poke", "wave-clear"],
  pick: ["target-access", "cc"],
  burst: ["burst"],
  sustain: ["sustained-damage"],
  dive: ["dive", "target-access"],
  "tank-shred": ["sustained-damage", "objective-control"],
  split: ["side-lane", "split-push"],
};

const TEAM_NEED_POINTS: Partial<Record<Capability, number>> = {
  frontline: 7, engage: 6, peel: 6, "sustained-damage": 5, "wave-clear": 4,
  "target-access": 5, "side-lane": 7, "objective-control": 4, disengage: 4,
};

function boardChampions(board: DraftBoard) {
  return Object.values(board)
    .filter((championId): championId is string => Boolean(championId))
    .map((championId) => CHAMPIONS.find((champion) => champion.id === championId))
    .filter((champion): champion is Champion => Boolean(champion));
}

function championsFromIds(championIds: string[]) {
  return [...new Set(championIds)]
    .map((championId) => CHAMPIONS.find((champion) => champion.id === championId))
    .filter((champion): champion is Champion => Boolean(champion));
}

function hasTag(champions: Champion[], tag: ChampionTag) {
  return champions.some((champion) => champion.tags.includes(tag));
}

function capabilities(champion: Champion) {
  return new Set(champion.tags.flatMap((tag) => TAG_CAPABILITIES[tag]));
}

function countCapability(champions: Champion[], capability: Capability) {
  return champions.filter((champion) => capabilities(champion).has(capability)).length;
}

function inferredDamageProfile(champion: Champion): DamageProfile {
  if (champion.damageProfile) return champion.damageProfile;
  const hasAd = champion.tags.includes("ad");
  const hasAp = champion.tags.includes("ap");
  return {
    physical: hasAd ? (hasAp ? "secondary" : "primary") : "none",
    magic: hasAp ? (hasAd ? "secondary" : "primary") : "none",
    true: "none",
  };
}

function damageWeight(value: DamageProfile[keyof DamageProfile]) {
  return value === "primary" ? 1 : value === "secondary" ? 0.5 : 0;
}

function damageSupply(champions: Champion[]) {
  return champions.reduce((supply, champion) => {
    const profile = inferredDamageProfile(champion);
    return {
      physical: supply.physical + damageWeight(profile.physical),
      magic: supply.magic + damageWeight(profile.magic),
      true: supply.true + damageWeight(profile.true),
    };
  }, { physical: 0, magic: 0, true: 0 });
}

function scoreScope(enemies: Champion[], confirmedEnemyBoard: DraftBoard): RecommendationScope {
  if (enemies.length === 0) return "team";
  return Object.values(confirmedEnemyBoard).filter(Boolean).length === 5 ? "draft" : "partial-draft";
}

function scoreChampion(
  candidate: Champion,
  allies: Champion[],
  enemies: Champion[],
  role: DraftRole,
  confirmedEnemyBoard: DraftBoard,
) {
  let score = 50;
  const factors: RecommendationFactor[] = [];
  const add = (id: RecommendationFactor["id"], points: number, label: string) => {
    score += points;
    factors.push({ id, points, label });
  };
  const subtract = (id: RecommendationFactor["id"], points: number, label: string) => {
    score -= points;
    factors.push({ id, points: -points, label });
  };

  const candidateDamage = inferredDamageProfile(candidate);
  const alliedDamage = damageSupply(allies);
  const physicalGap = alliedDamage.magic - alliedDamage.physical;
  const magicGap = alliedDamage.physical - alliedDamage.magic;
  if (physicalGap >= 1 && candidateDamage.physical !== "none") {
    add("damage-profile", Math.min(10, Math.round(physicalGap * 5)), "Añade una amenaza física donde el equipo está cargado de daño mágico.");
  } else if (magicGap >= 1 && candidateDamage.magic !== "none") {
    add("damage-profile", Math.min(10, Math.round(magicGap * 5)), "Añade daño mágico donde el equipo está cargado de daño físico.");
  }
  if (candidateDamage.true !== "none" && hasTag(enemies, "frontline")) {
    add("damage-profile", 3, "Aporta daño verdadero útil contra una frontline rival.");
  }

  const candidateCapabilities = capabilities(candidate);
  for (const [capability, maxPoints] of Object.entries(TEAM_NEED_POINTS) as Array<[Capability, number]>) {
    if (candidateCapabilities.has(capability) && countCapability(allies, capability) === 0) {
      add("team-needs", maxPoints, `Cubre una necesidad del equipo: ${capability.replace("-", " ")}.`);
    }
  }

  const alliedEngage = countCapability(allies, "engage") + countCapability(allies, "target-access");
  if (candidateCapabilities.has("target-access") && alliedEngage >= 2) {
    add("ally-synergy", 5, "Puede convertir el engage aliado en acceso fiable a objetivos prioritarios.");
  }
  if (candidateCapabilities.has("side-lane") && countCapability(allies, "engage") > 0 && countCapability(allies, "side-lane") <= 1) {
    add("win-condition", 6, "Abre presión lateral para complementar las peleas de equipo aliadas.");
  }

  if (hasTag(enemies, "dive") && candidateCapabilities.has("peel")) add("enemy-response", 8, "Protege al carry contra el dive rival.");
  if (hasTag(enemies, "frontline") && candidate.tags.includes("tank-shred")) add("enemy-response", 8, "Tiene daño sostenido contra la frontline rival.");
  if (hasTag(enemies, "poke") && candidateCapabilities.has("engage")) add("enemy-response", 6, "Puede cerrar distancia contra poke.");
  if (hasTag(enemies, "sustain") && candidateCapabilities.has("burst")) add("enemy-response", 5, "Puede castigar antes de que el rival se sostenga.");
  if (hasTag(enemies, "pick") && candidateCapabilities.has("peel")) add("enemy-response", 5, "Añade herramientas para neutralizar picks rivales.");

  // Champion Select does not expose this lane; only a confirmed live-game Top can affect it.
  if (role === "top" && confirmedEnemyBoard.top) {
    const enemyTop = getChampionById(confirmedEnemyBoard.top);
    const matchup = enemyTop ? getTopMatchupAdjustment(candidate.name, [enemyTop]) : { score: 0, reason: null };
    if (matchup.score > 0 && matchup.reason) add("lane-matchup", matchup.score, matchup.reason);
    if (matchup.score < 0) subtract("lane-matchup", Math.abs(matchup.score), matchup.reason ?? "El matchup de Top es desfavorable.");
  }

  const frontlineCount = countCapability(allies, "frontline");
  const engageCount = countCapability(allies, "engage");
  if (candidateCapabilities.has("frontline") && frontlineCount >= 2) subtract("redundancy", 8, "Añade frontline a una composición que ya la tiene cubierta.");
  else if (candidateCapabilities.has("frontline") && frontlineCount === 1) subtract("redundancy", 3, "La frontline ya está parcialmente cubierta.");
  if (candidateCapabilities.has("engage") && engageCount >= 2) subtract("redundancy", 4, "El equipo ya cuenta con varias formas de iniciar.");

  const metaAdjustment = getLaneMetaAdjustment(role, candidate.name);
  if (metaAdjustment > 0) add("champion-strength", metaAdjustment, `Tiene una posición competitiva sólida en el meta de ${role}.`);

  const reasons = factors
    .filter((factor) => factor.points > 0)
    .sort((left, right) => right.points - left.points)
    .slice(0, 3)
    .map((factor) => factor.label);
  if (reasons.length === 0) reasons.push("Es una elección estable para esta línea.");

  return { score: Math.max(1, Math.min(score, 99)), reasons, factors, scope: scoreScope(enemies, confirmedEnemyBoard) };
}

export function getChampionById(id: string | null) {
  return CHAMPIONS.find((champion) => champion.id === id) ?? null;
}

export function getChampionsForRole(role: DraftRole) {
  return CHAMPIONS.filter((champion) => champion.roles.includes(role));
}

export function recommendChampions(
  role: DraftRole,
  alliedBoard: DraftBoard,
  enemyBoard: DraftBoard,
  preferredChampionIds?: string[],
  bannedChampionIds: string[] = [],
  unassignedEnemyChampionIds: string[] = [],
): ChampionRecommendation[] {
  const lockedChampionIds = new Set([...Object.values(alliedBoard), ...Object.values(enemyBoard), ...bannedChampionIds]);
  const allies = boardChampions(alliedBoard);
  const confirmedEnemies = boardChampions(enemyBoard);
  const enemies = [...confirmedEnemies, ...championsFromIds(unassignedEnemyChampionIds.filter((id) => !confirmedEnemies.some((champion) => champion.id === id)))];
  const rankedCandidates = getChampionsForRole(role)
    .filter((champion) => !lockedChampionIds.has(champion.id))
    .map((champion) => ({ champion, ...scoreChampion(champion, allies, enemies, role, enemyBoard) }))
    .sort((left, right) => right.score - left.score || left.champion.name.localeCompare(right.champion.name));

  if (!preferredChampionIds || preferredChampionIds.length === 0) return rankedCandidates.slice(0, 3);
  const poolRecommendations = rankedCandidates.filter(({ champion }) => preferredChampionIds.includes(champion.id));
  if (poolRecommendations.length === 0) return rankedCandidates.slice(0, 3).map((recommendation) => ({ ...recommendation, isOutsidePool: true }));
  const strongestOutsidePool = rankedCandidates.find(({ champion }) => !preferredChampionIds.includes(champion.id));
  const outsidePoolRecommendation = strongestOutsidePool && strongestOutsidePool.score > poolRecommendations[0]!.score
    ? { ...strongestOutsidePool, isOutsidePool: true }
    : null;
  return [...poolRecommendations.slice(0, 3), ...(outsidePoolRecommendation ? [outsidePoolRecommendation] : [])]
    .sort((left, right) => right.score - left.score || left.champion.name.localeCompare(right.champion.name));
}

export function getChampionFit(
  role: DraftRole,
  championId: string | null,
  alliedBoard: DraftBoard,
  enemyBoard: DraftBoard,
  unassignedEnemyChampionIds: string[] = [],
): ChampionRecommendation | null {
  const champion = getChampionById(championId);
  if (!champion) return null;
  const allies = boardChampions({ ...alliedBoard, [role]: null });
  const confirmedEnemies = boardChampions(enemyBoard);
  const enemies = [...confirmedEnemies, ...championsFromIds(unassignedEnemyChampionIds.filter((id) => !confirmedEnemies.some((enemy) => enemy.id === id)))];
  return { champion, ...scoreChampion(champion, allies, enemies, role, enemyBoard) };
}
