import type { InGameCoachAnalysis, LiveGameSnapshot } from "../domain/in-game-coach.types";
import type { Champion, DraftBoard, LeagueItemPurchaseDetail, LeagueItemReference } from "../domain/lol-draft.types";
import type { SelectedLoadout } from "./champion-loadout.service";
import { CHAMPIONS } from "./lol-draft-data";

export type PurchaseStep = {
  item: LeagueItemReference;
  status: "owned" | "next" | "later";
  reason: string;
};

export type LivePurchasePlan = {
  strategy: "survive" | "tempo" | "snowball";
  headline: string;
  rationale: string;
  steps: PurchaseStep[];
  opening: {
    items: LeagueItemReference[];
    status: "owned" | "recommended";
    rationale: string;
  };
  nextPurchase: {
    target: LeagueItemReference;
    buyNow: LeagueItemReference | null;
    buyNowCost: number | null;
    componentPath: LeagueItemReference[];
    rationale: string;
  } | null;
};

const DEFENSIVE_BOOTS = {
  physical: { id: 3047, name: "Botas blindadas" },
  magic: { id: 3111, name: "Botas de mercurio" },
} satisfies Record<string, LeagueItemReference>;

const DORAN_STARTERS = {
  shield: { id: 1054, name: "Escudo de Doran" },
  blade: { id: 1055, name: "Espada de Doran" },
  ring: { id: 1056, name: "Anillo de Doran" },
  potion: { id: 2003, name: "Poción de vida" },
} satisfies Record<string, LeagueItemReference>;

const TIER_TWO_BOOT_IDS = new Set([3006, 3009, 3020, 3047, 3111, 3117, 3158]);
const TIER_TWO_BOOT_NAMES = new Set([
  "botasblindadas",
  "botasdemercurio",
  "botasdeberserker",
  "botasderapidez",
  "botasdelhechicero",
  "botasjoniasdelalucidez",
  "botasdesincronia",
]);

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function sameItem(left: LeagueItemReference, right: LeagueItemReference) {
  return left.id !== undefined && right.id !== undefined
    ? left.id === right.id
    : normalize(left.name) === normalize(right.name);
}

function isTierTwoBoots(item: LeagueItemReference) {
  return (item.id !== undefined && TIER_TWO_BOOT_IDS.has(item.id)) || TIER_TWO_BOOT_NAMES.has(normalize(item.name));
}

function getChampionByName(name: string | null | undefined) {
  return name ? CHAMPIONS.find((champion) => normalize(champion.name) === normalize(name)) ?? null : null;
}

function physicalThreat(champion: Champion) {
  if (champion.damageProfile) return champion.damageProfile.physical === "primary" ? 2 : champion.damageProfile.physical === "secondary" ? 1 : 0;
  return champion.tags.includes("ad") ? 2 : 0;
}

function magicThreat(champion: Champion) {
  if (champion.damageProfile) return champion.damageProfile.magic === "primary" ? 2 : champion.damageProfile.magic === "secondary" ? 1 : 0;
  return champion.tags.includes("ap") ? 2 : 0;
}

function chooseDefensiveBoots(snapshot: LiveGameSnapshot, enemyBoard: DraftBoard) {
  const opponent = getChampionByName(snapshot.laneOpponent?.championName);
  const enemies = Object.values(enemyBoard).flatMap((championId) => {
    const champion = CHAMPIONS.find((candidate) => candidate.id === championId);
    return champion ? [champion] : [];
  });
  const physical = enemies.reduce((score, champion) => score + physicalThreat(champion), 0) + (opponent ? physicalThreat(opponent) : 0);
  const magic = enemies.reduce((score, champion) => score + magicThreat(champion), 0) + (opponent ? magicThreat(opponent) : 0);
  const control = enemies.filter((champion) => champion.tags.includes("engage") || champion.tags.includes("pick")).length;

  if (opponent && physicalThreat(opponent) > magicThreat(opponent) && physical >= magic) {
    return { item: DEFENSIVE_BOOTS.physical, reason: `Prioridad defensiva contra el daño físico de ${opponent.name}.` };
  }
  if (magic > physical || control >= 3) {
    return { item: DEFENSIVE_BOOTS.magic, reason: control >= 3 ? "Prioridad contra el control rival acumulado." : "Prioridad contra el daño mágico rival." };
  }
  return null;
}

function uniqueItems(items: LeagueItemReference[]) {
  return items.filter((item, index) => !items.slice(0, index).some((candidate) => sameItem(candidate, item)));
}

function isOwned(item: LeagueItemReference, ownedItems: LeagueItemReference[]) {
  return ownedItems.some((candidate) => sameItem(candidate, item));
}

function isPhysicalComponent(item: LeagueItemReference) {
  const name = normalize(item.name);
  return name.includes("armadura") || name.includes("cota") || name.includes("chaleco");
}

function isMagicResistanceComponent(item: LeagueItemReference) {
  const name = normalize(item.name);
  return name.includes("resistencia magica") || name.includes("manto") || name.includes("negatron");
}

function isTempoComponent(item: LeagueItemReference) {
  const name = normalize(item.name);
  return name.includes("brillo") || name.includes("espada") || name.includes("pico") || name.includes("cetro") || name.includes("amplificador");
}

function getOpeningRecommendation(
  champion: Champion,
  loadout: SelectedLoadout,
  analysis: InGameCoachAnalysis | null,
  opponent: Champion | null,
) {
  if (loadout.starterItems?.length) {
    return { items: loadout.starterItems, rationale: "Inicio de mayor uso para este campeón y línea según el snapshot de meta." };
  }

  const defensiveStart = analysis?.posture === "defensive" || opponent?.tags.includes("poke") || opponent?.tags.includes("burst");
  if (defensiveStart || champion.tags.includes("frontline") || loadout.runes.primary.includes("Garras del inmortal")) {
    return { items: [DORAN_STARTERS.shield, DORAN_STARTERS.potion], rationale: "Escudo de Doran prioriza vida y regeneración para resistir el intercambio de línea." };
  }
  if (champion.tags.includes("ap")) {
    return { items: [DORAN_STARTERS.ring, DORAN_STARTERS.potion], rationale: "Anillo de Doran aporta el recurso y daño temprano que necesita este plan mágico." };
  }
  return { items: [DORAN_STARTERS.blade, DORAN_STARTERS.potion], rationale: "Espada de Doran prioriza daño y sustain para disputar los primeros intercambios." };
}

function purchasePriority(item: LeagueItemPurchaseDetail, strategy: LivePurchasePlan["strategy"], physical: boolean, magic: boolean) {
  if (strategy === "survive" && physical && isPhysicalComponent(item.item)) return 0;
  if (strategy === "survive" && magic && isMagicResistanceComponent(item.item)) return 0;
  if (strategy !== "survive" && isTempoComponent(item.item)) return 0;
  return 1;
}

function orderComponents(details: LeagueItemPurchaseDetail[], strategy: LivePurchasePlan["strategy"], physical: boolean, magic: boolean) {
  return [...details].sort((left, right) => purchasePriority(left, strategy, physical, magic) - purchasePriority(right, strategy, physical, magic));
}

function getAffordablePurchase(
  detail: LeagueItemPurchaseDetail,
  ownedItems: LeagueItemReference[],
  currentGold: number | null,
  strategy: LivePurchasePlan["strategy"],
  physical: boolean,
  magic: boolean,
): LeagueItemPurchaseDetail {
  if (isOwned(detail.item, ownedItems)) return detail;
  if (currentGold !== null && detail.totalGold !== null && detail.totalGold <= currentGold) return detail;

  const remainingComponents = orderComponents(
    detail.components.filter((component) => !isOwned(component.item, ownedItems)),
    strategy,
    physical,
    magic,
  );
  return remainingComponents.length > 0
    ? getAffordablePurchase(remainingComponents[0]!, ownedItems, currentGold, strategy, physical, magic)
    : detail;
}

function getComponentPath(
  target: LeagueItemPurchaseDetail,
  ownedItems: LeagueItemReference[],
  strategy: LivePurchasePlan["strategy"],
  physical: boolean,
  magic: boolean,
) {
  const path: LeagueItemReference[] = [];
  let current: LeagueItemPurchaseDetail | null = target;

  while (current) {
    const next: LeagueItemPurchaseDetail | null = orderComponents(
      current.components.filter((component) => !isOwned(component.item, ownedItems)),
      strategy,
      physical,
      magic,
    )[0] ?? null;
    if (!next) break;
    path.push(next.item);
    current = next;
  }

  return path.reverse();
}

export function getLivePurchasePlan(
  champion: Champion | null,
  loadout: SelectedLoadout | null,
  snapshot: LiveGameSnapshot,
  analysis: InGameCoachAnalysis | null,
  enemyBoard: DraftBoard,
  itemDetails: LeagueItemPurchaseDetail[] = [],
): LivePurchasePlan | null {
  if (!champion || !loadout || snapshot.status !== "in-game") return null;

  const ownedItems = snapshot.itemReferences;
  const baseBuild = loadout.buildItems?.length
    ? loadout.buildItems
    : loadout.build.map((name) => ({ name }));
  const ownedTierTwoBoots = ownedItems.find(isTierTwoBoots) ?? null;
  const loadoutHasBoots = baseBuild.some(isTierTwoBoots);
  const defensiveBoots = loadoutHasBoots
    ? null
    : ownedTierTwoBoots
      ? { item: ownedTierTwoBoots, reason: "Botas completadas y detectadas en tu inventario." }
      : chooseDefensiveBoots(snapshot, enemyBoard);
  const defensive = analysis?.posture === "defensive";
  const macroWithoutBoots = analysis?.phase === "transition" || analysis?.phase === "macro";
  const ordered = [...baseBuild];

  if (defensiveBoots) {
    const insertionIndex = defensive || macroWithoutBoots ? 0 : Math.min(1, ordered.length);
    ordered.splice(insertionIndex, 0, defensiveBoots.item);
  }

  const items = uniqueItems(ordered);
  let nextAssigned = false;
  const steps = items.map((item) => {
    const owned = isOwned(item, ownedItems);
    const status = owned ? "owned" : nextAssigned ? "later" : "next";
    if (status === "next") nextAssigned = true;
    return {
      item,
      status,
      reason: defensiveBoots && sameItem(item, defensiveBoots.item)
        ? defensiveBoots.reason
        : `Parte del loadout ${loadout.label}.`,
    } satisfies PurchaseStep;
  });

  const strategy = defensive ? "survive" : analysis?.posture === "aggressive" ? "snowball" : "tempo";
  const opponent = getChampionByName(snapshot.laneOpponent?.championName);
  const physical = opponent ? physicalThreat(opponent) > magicThreat(opponent) : false;
  const magic = opponent ? magicThreat(opponent) > physicalThreat(opponent) : false;
  const opening = getOpeningRecommendation(champion, loadout, analysis, opponent);
  const nextStep = steps.find((step) => step.status === "next") ?? null;
  const targetDetail = nextStep
    ? itemDetails.find((detail) => sameItem(detail.item, nextStep.item)) ?? null
    : null;
  const buyNow = targetDetail
    ? getAffordablePurchase(targetDetail, ownedItems, snapshot.currentGold, strategy, physical, magic)
    : null;
  const nextPurchase = nextStep ? {
    target: nextStep.item,
    buyNow: buyNow?.item ?? null,
    buyNowCost: buyNow?.totalGold ?? null,
    componentPath: targetDetail ? getComponentPath(targetDetail, ownedItems, strategy, physical, magic) : [],
    rationale: buyNow && !sameItem(buyNow.item, nextStep.item)
      ? `Construye ${nextStep.item.name} desde ${buyNow.item.name} para que tu siguiente back responda al plan actual.`
      : nextStep.reason,
  } : null;

  return {
    strategy,
    headline: strategy === "survive" ? "Estabiliza antes del núcleo" : strategy === "snowball" ? "Convierte la ventaja" : "Completa tu siguiente pico",
    rationale: defensiveBoots
      ? `${defensiveBoots.reason} Después continúa con el orden del loadout seleccionado.`
      : "Mantén el orden del loadout seleccionado y actualízalo con cada compra detectada.",
    steps,
    opening: {
      ...opening,
      status: opening.items.every((item) => isOwned(item, ownedItems)) ? "owned" : "recommended",
    },
    nextPurchase,
  };
}
