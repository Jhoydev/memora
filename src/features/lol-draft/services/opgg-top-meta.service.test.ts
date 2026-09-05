import { describe, expect, it } from "vitest";
import { getLaneMetaChampion } from "./opgg-lane-meta.service";

describe("getLaneMetaChampion", () => {
  it("encuentra campeones aunque League y OP.GG usen puntuacion distinta", () => {
    expect(getLaneMetaChampion("top", "K'Sante")?.name).toBe("K'Sante");
  });

  it("no inventa datos para campeones que no estan en el snapshot", () => {
    expect(getLaneMetaChampion("top", "Campeon inexistente")).toBeNull();
  });
});
