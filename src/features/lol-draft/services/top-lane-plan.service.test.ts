import { describe, expect, it } from "vitest";
import { getChampionById } from "./lol-draft.service";
import { getTopLanePlans } from "./top-lane-plan.service";

describe("getTopLanePlans", () => {
  it("ofrece un plan seguro y variantes para los posibles tops detectados", () => {
    const malphite = getChampionById("malphite");
    expect(malphite).not.toBeNull();

    const plans = getTopLanePlans(malphite!, ["darius", "aurora"]);

    expect(plans[0]).toMatchObject({ kind: "safe", opponent: null });
    expect(plans.find((plan) => plan.opponent?.id === "darius")?.loadout.id).toBe("frontline-ad");
    expect(plans.find((plan) => plan.opponent?.id === "aurora")?.loadout.id).toBe("poke-ap");
  });

  it("no genera planes de línea para campeones que no pueden jugar Top", () => {
    const jinx = getChampionById("jinx");
    expect(getTopLanePlans(jinx!, ["darius"])).toEqual([]);
  });
});
