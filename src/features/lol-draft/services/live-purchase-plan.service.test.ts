import { describe, expect, it } from "vitest";
import type { InGameCoachAnalysis, LiveGameSnapshot, LivePlayerSnapshot } from "../domain/in-game-coach.types";
import type { DraftBoard, LeagueItemPurchaseDetail } from "../domain/lol-draft.types";
import type { SelectedLoadout } from "./champion-loadout.service";
import { getChampionById } from "./lol-draft.service";
import { getLivePurchasePlan } from "./live-purchase-plan.service";

const loadout: SelectedLoadout = {
  id: "camille-burst",
  label: "Contra burst",
  build: ["Fuerza de trinidad", "Hidra titánica", "Calibrador de Sterak"],
  buildItems: [{ id: 3078, name: "Fuerza de trinidad" }, { id: 3748, name: "Hidra titánica" }, { id: 3053, name: "Calibrador de Sterak" }],
  runes: { primary: "Garras del inmortal", secondary: "Valor", shards: "Vida" },
  rationale: "Test",
  score: 90,
};

function player(championName: string, role: LivePlayerSnapshot["role"], team: string): LivePlayerSnapshot {
  return {
    championName, role, roleSource: "live-client", team, level: 6,
    scores: { kills: 0, deaths: 0, assists: 0, creepScore: 50, wardScore: 0 },
    items: [], visibleInventoryGold: 0, inventoryGoldSource: "data-dragon", isDead: false, respawnTimer: 0,
  };
}

function snapshot(ownedIds: number[] = []): LiveGameSnapshot {
  const activePlayer = player("Camille", "top", "ORDER");
  const laneOpponent = player("Darius", "top", "CHAOS");
  const itemReferences = ownedIds.map((id) => ({ id, name: id === 3047 ? "Botas blindadas" : "Objeto" }));
  return {
    status: "in-game", championName: "Camille", currentGold: 500, gameTime: 600,
    items: itemReferences.map((item) => item.name), itemReferences, activePlayer, laneOpponent,
    allies: [activePlayer], enemies: [laneOpponent],
  };
}

const enemyBoard: DraftBoard = { top: "darius", jungle: "udyr", mid: "galio", adc: "kaisa", support: "fiddlesticks" };
const camille = getChampionById("camille")!;

function analysis(posture: InGameCoachAnalysis["posture"]): InGameCoachAnalysis {
  return {
    phase: "laning", advantage: posture === "defensive" ? "behind" : posture === "aggressive" ? "ahead" : "even",
    posture, score: 0, confidence: "high", opponentName: "Darius", title: "Test", summary: "Test", actions: [], avoid: "Test", factors: [],
    matchup: { source: "specific", label: "Test", summary: "Test" },
    teamPriorities: {
      strongestAlly: null,
      strongestEnemy: null,
      allyAction: null,
      enemyAction: null,
      buildAdjustment: null,
    },
  };
}

describe("live purchase plan", () => {
  it("prioritizes armor boots when behind against a physical lane opponent", () => {
    const plan = getLivePurchasePlan(camille, loadout, snapshot(), analysis("defensive"), enemyBoard);

    expect(plan?.steps[0]).toMatchObject({ item: { id: 3047 }, status: "next" });
    expect(plan?.strategy).toBe("survive");
  });

  it("advances to the core item after detecting the situational boots", () => {
    const plan = getLivePurchasePlan(camille, loadout, snapshot([3047]), analysis("defensive"), enemyBoard);

    expect(plan?.steps[0]).toMatchObject({ item: { id: 3047 }, status: "owned" });
    expect(plan?.steps[1]).toMatchObject({ item: { id: 3078 }, status: "next" });
  });

  it("keeps the core first when the player is ahead", () => {
    const plan = getLivePurchasePlan(camille, loadout, snapshot(), analysis("aggressive"), enemyBoard);

    expect(plan?.steps[0]).toMatchObject({ item: { id: 3078 }, status: "next" });
    expect(plan?.steps[1]).toMatchObject({ item: { id: 3047 }, status: "later" });
  });

  it("recommends a defensive component before Iceborn Gauntlet against a physical lane", () => {
    const icebornLoadout: SelectedLoadout = {
      ...loadout,
      build: ["Guantelete de hielo"],
      buildItems: [{ id: 6662, name: "Guantelete de hielo" }],
    };
    const details: LeagueItemPurchaseDetail[] = [{
      item: { id: 6662, name: "Guantelete de hielo" }, totalGold: 3000,
      components: [
        { item: { id: 3057, name: "Brillo" }, totalGold: 900, components: [{ item: { id: 1027, name: "Cristal de zafiro" }, totalGold: 300, components: [] }] },
        { item: { id: 1031, name: "Cota de malla" }, totalGold: 800, components: [{ item: { id: 1029, name: "Armadura de tela" }, totalGold: 300, components: [] }] },
      ],
    }];
    const plan = getLivePurchasePlan(camille, icebornLoadout, snapshot([3047]), analysis("defensive"), enemyBoard, details);

    expect(plan?.opening.items[0]).toMatchObject({ id: 1054, name: "Escudo de Doran" });
    expect(plan?.nextPurchase?.target).toMatchObject({ id: 6662 });
    expect(plan?.nextPurchase?.buyNow).toMatchObject({ id: 1029, name: "Armadura de tela" });
  });
});
