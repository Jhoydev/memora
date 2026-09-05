import { describe, expect, it } from "vitest";
import { EMPTY_DRAFT_BOARD } from "./lol-draft-data";
import { getChampionById } from "./lol-draft.service";
import { getChampionLoadout, getChampionLoadouts } from "./champion-loadout.service";

describe("getChampionLoadout", () => {
  it("elige para Camille el paquete de Garras y defensa contra burst", () => {
    const camille = getChampionById("camille");
    expect(camille).not.toBeNull();

    const loadout = getChampionLoadout(camille!, { ...EMPTY_DRAFT_BOARD, mid: "ahri" });
    expect(loadout.label).toBe("Contra burst");
    expect(loadout.score).toBe(90);
    expect(loadout.runes.primary).toBe("Garras del inmortal");
    expect(loadout.build).toContain("Calibrador de Sterak");
  });

  it("expone las dos alternativas de Malphite y prioriza la respuesta contra AD", () => {
    const malphite = getChampionById("malphite");
    const loadouts = getChampionLoadouts(malphite!, { ...EMPTY_DRAFT_BOARD, jungle: "nocturne" });

    expect(loadouts.length).toBeGreaterThanOrEqual(4);
    expect(loadouts[0]?.label).toBe("Frontline contra AD");
    expect(loadouts.some((loadout) => loadout.label === "Poke AP")).toBe(true);
    expect(loadouts.some((loadout) => loadout.label === "Meta OP.GG · core")).toBe(true);
  });
});
