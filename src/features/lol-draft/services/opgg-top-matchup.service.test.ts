import { describe, expect, it } from "vitest";
import { getChampionById } from "./lol-draft.service";
import { getTopMatchupAdjustment } from "./opgg-top-matchup.service";

describe("getTopMatchupAdjustment", () => {
  it("incorpora un matchup real de OP.GG para un top detectado", () => {
    const malphite = getChampionById("malphite");
    expect(malphite).not.toBeNull();

    const adjustment = getTopMatchupAdjustment("Gnar", [malphite!]);
    expect(adjustment.score).toBeLessThan(0);
    expect(adjustment.reason).toContain("Malphite");
  });
});
