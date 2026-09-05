import { describe, expect, it } from "vitest";
import type { LiveGameSnapshot, LivePlayerSnapshot } from "../domain/in-game-coach.types";
import { analyzeInGameState, getGamePhase, getTeamPriorities, scoreLaneState } from "./in-game-coach.service";

function player(overrides: Partial<LivePlayerSnapshot> = {}): LivePlayerSnapshot {
  return {
    championName: "Malphite",
    role: "top",
    roleSource: "live-client",
    team: "ORDER",
    level: 6,
    scores: { kills: 0, deaths: 0, assists: 0, creepScore: 55, wardScore: 4 },
    items: [],
    visibleInventoryGold: 2200,
    inventoryGoldSource: "data-dragon",
    isDead: false,
    respawnTimer: 0,
    ...overrides,
  };
}

function game(activePlayer: LivePlayerSnapshot | null, laneOpponent: LivePlayerSnapshot | null): LiveGameSnapshot {
  return {
    status: "in-game",
    championName: activePlayer?.championName ?? null,
    currentGold: 500,
    gameTime: 10 * 60,
    items: [],
    itemReferences: [],
    activePlayer,
    laneOpponent,
    allies: activePlayer ? [activePlayer] : [],
    enemies: laneOpponent ? [laneOpponent] : [],
  };
}

describe("in-game coach", () => {
  it("separates opening, lane, transition and macro phases", () => {
    expect(getGamePhase(120)).toBe("opening");
    expect(getGamePhase(600)).toBe("laning");
    expect(getGamePhase(900)).toBe("transition");
    expect(getGamePhase(1400)).toBe("macro");
  });

  it("caps individual signals so one metric cannot dominate the reading", () => {
    const result = scoreLaneState(
      player({ level: 18, scores: { kills: 20, deaths: 0, assists: 10, creepScore: 400, wardScore: 0 }, visibleInventoryGold: 20000 }),
      player({ championName: "Darius", team: "CHAOS", level: 1, visibleInventoryGold: 0 }),
      600,
    );

    expect(result.factors.find((factor) => factor.id === "level")?.points).toBe(36);
    expect(result.factors.find((factor) => factor.id === "farm")?.points).toBe(24);
    expect(result.factors.find((factor) => factor.id === "combat")?.points).toBe(24);
    expect(result.factors.find((factor) => factor.id === "inventory")?.points).toBe(30);
    expect(result.score).toBe(100);
  });

  it("recommends a defensive lane plan when the opponent leads", () => {
    const active = player({ level: 5, scores: { kills: 0, deaths: 2, assists: 0, creepScore: 38, wardScore: 2 }, visibleInventoryGold: 1500 });
    const opponent = player({ championName: "Darius", team: "CHAOS", level: 7, scores: { kills: 2, deaths: 0, assists: 0, creepScore: 70, wardScore: 3 }, visibleInventoryGold: 3100 });
    const analysis = analyzeInGameState(game(active, opponent));

    expect(analysis?.posture).toBe("defensive");
    expect(analysis?.opponentName).toBe("Darius");
    expect(analysis?.score).toBeLessThan(-35);
    expect(analysis?.title).toBe("Defiende recursos clave");
    expect(analysis?.matchup).toMatchObject({ source: "specific", label: "Matchup específico · Darius" });
    expect(analysis?.actions[0]).toContain("vida");
  });

  it("returns a low-confidence safe plan until the lane opponent is known", () => {
    const analysis = analyzeInGameState(game(player(), null));

    expect(analysis).toMatchObject({ advantage: "unknown", confidence: "low", title: "Plan seguro de línea" });
    expect(analysis?.factors).toHaveLength(0);
  });

  it("identifies the strongest visible ally and enemy with actionable priorities", () => {
    const active = player();
    const strongestAlly = player({
      championName: "Jinx",
      role: "adc",
      level: 10,
      scores: { kills: 6, deaths: 1, assists: 4, creepScore: 170, wardScore: 4 },
      visibleInventoryGold: 6500,
    });
    const strongestEnemy = player({
      championName: "Aurora",
      role: null,
      team: "CHAOS",
      level: 11,
      scores: { kills: 7, deaths: 1, assists: 3, creepScore: 160, wardScore: 4 },
      visibleInventoryGold: 7000,
    });
    const priorities = getTeamPriorities({
      ...game(active, strongestEnemy),
      allies: [active, strongestAlly],
      enemies: [strongestEnemy],
    });

    expect(priorities.strongestAlly).toMatchObject({ championName: "Jinx", role: "adc" });
    expect(priorities.strongestEnemy).toMatchObject({ championName: "Aurora", role: null });
    expect(priorities.allyAction).toContain("Jinx");
    expect(priorities.enemyAction).toContain("Aurora");
    expect(priorities.buildAdjustment).toContain("resistencia mágica");
  });

  it("keeps the previous state near a boundary to avoid flickering", () => {
    const active = player({ scores: { kills: 0, deaths: 0, assists: 0, creepScore: 66, wardScore: 2 } });
    const opponent = player({ championName: "Darius", team: "CHAOS", scores: { kills: 0, deaths: 0, assists: 0, creepScore: 55, wardScore: 2 } });
    const snapshot = game(active, opponent);
    const previous = { ...analyzeInGameState(snapshot)!, advantage: "even" as const };
    const stable = analyzeInGameState(snapshot, previous);

    expect(stable?.score).toBe(13);
    expect(stable?.advantage).toBe("even");
  });
});
