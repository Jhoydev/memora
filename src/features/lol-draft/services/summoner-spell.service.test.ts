import { describe, expect, it } from "vitest";
import { EMPTY_DRAFT_BOARD } from "./lol-draft-data";
import { getSummonerSpellRecommendation } from "./summoner-spell.service";

describe("getSummonerSpellRecommendation", () => {
  it("recomienda Exhaust para support contra dive rival", () => {
    expect(getSummonerSpellRecommendation("support", { ...EMPTY_DRAFT_BOARD, jungle: "nocturne" }).spells).toEqual([{ id: "SummonerFlash", name: "Destello" }, { id: "SummonerExhaust", name: "Extenuación" }]);
  });

  it("mantiene Aplastar como fijo en jungla", () => {
    expect(getSummonerSpellRecommendation("jungle", EMPTY_DRAFT_BOARD).spells).toEqual([{ id: "SummonerFlash", name: "Destello" }, { id: "SummonerSmite", name: "Aplastar" }]);
  });
});
