import { describe, expect, it } from "vitest";
import { getLaneMatchupAdvice } from "./lane-matchup-playbook.service";

describe("lane matchup playbook", () => {
  it("returns distinct tactical advice for Darius and Aurora", () => {
    const darius = getLaneMatchupAdvice("Malphite", "Darius", "even");
    const aurora = getLaneMatchupAdvice("Malphite", "Aurora", "even");

    expect(darius.source).toBe("specific");
    expect(darius.action).toContain("último golpe");
    expect(aurora.source).toBe("specific");
    expect(aurora.action).toContain("poke");
    expect(darius.avoid).not.toBe(aurora.avoid);
  });

  it("falls back to an archetype when a rival has no explicit matchup file", () => {
    const advice = getLaneMatchupAdvice("Malphite", "Syndra", "behind");

    expect(advice).toMatchObject({ source: "archetype", label: "Arquetipo · poke/burst" });
  });
});
