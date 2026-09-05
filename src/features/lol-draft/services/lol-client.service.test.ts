import { describe, expect, it } from "vitest";
import type { LivePlayerSnapshot } from "../domain/in-game-coach.types";
import { inferActivePlayerRole } from "./lol-client.service";

function player(championName: string, role: LivePlayerSnapshot["role"]): LivePlayerSnapshot {
  return {
    championName,
    role,
    roleSource: role ? "live-client" : "unknown",
    team: "ORDER",
    level: 1,
    scores: { kills: 0, deaths: 0, assists: 0, creepScore: 0, wardScore: 0 },
    items: [],
    visibleInventoryGold: 0,
    inventoryGoldSource: "data-dragon",
    isDead: false,
    respawnTimer: 0,
  };
}

describe("live client role fallback", () => {
  it("infers the only open compatible role in training mode", () => {
    const active = player("Camille", null);
    const allies = [active, player("Sejuani", "jungle"), player("Ahri", "mid"), player("Tristana", "adc"), player("Alistar", "support")];

    expect(inferActivePlayerRole(active, allies)).toBe("top");
  });

  it("does not infer a role when more than one position is open", () => {
    const active = player("Camille", null);
    const allies = [active, player("Ahri", "mid"), player("Tristana", "adc"), player("Alistar", "support")];

    expect(inferActivePlayerRole(active, allies)).toBeNull();
  });

  it("does not force an incompatible champion into the remaining role", () => {
    const active = player("Jinx", null);
    const allies = [active, player("Sejuani", "jungle"), player("Ahri", "mid"), player("Tristana", "adc"), player("Alistar", "support")];

    expect(inferActivePlayerRole(active, allies)).toBeNull();
  });
});
