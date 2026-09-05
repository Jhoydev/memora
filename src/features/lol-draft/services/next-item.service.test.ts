import { describe, expect, it } from "vitest";
import { getNextItemRecommendation } from "./next-item.service";

const loadout = {
  id: "test",
  label: "Test",
  build: ["Fuerza de trinidad", "Cuchilla negra", "Calibrador de Sterak"],
  runes: { primary: "Conquistador", secondary: "Valor", shards: "Vida" },
  rationale: "Test",
  score: 75,
};

describe("getNextItemRecommendation", () => {
  it("propone el primer objeto de la build que no está en el inventario", () => {
    expect(getNextItemRecommendation(loadout, ["Fuerza de trinidad"])).toBe("Cuchilla negra");
  });

  it("normaliza acentos al comparar los objetos", () => {
    expect(getNextItemRecommendation(loadout, ["Fuerza de trinidad", "Cuchilla negra", "Calibrador de Sterak"])).toBeNull();
  });
});
