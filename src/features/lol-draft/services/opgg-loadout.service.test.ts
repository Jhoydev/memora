import { describe, expect, it } from "vitest";
import { getChampionById } from "./lol-draft.service";
import { getOpggLoadouts } from "./opgg-loadout.service";
import { parseOpggLoadouts } from "./opgg-loadout.service";

describe("parseOpggLoadouts", () => {
  it("empareja cada alternativa de objetos con las runas que devolvió OP.GG", () => {
    const content = 'LolGetChampionAnalysis(Data(CoreItems(["Objeto uno","Objeto dos","Objeto tres"],100,55,0.2),CoreItems(["Botas"],300,150,0.6),CoreItems(["Inicio"],300,150,0.6),[CoreItems(["Final"],20,12,0.1)],[CoreItems(["Cuarto A"],80,48,0.3),CoreItems(["Cuarto B"],40,20,0.15)],[CoreItems(["Quinto"],20,11,0.08)],Runes("Precisión",["Conquistador"],"Valor",["Revestimiento de huesos"],[5005,5008,5001],120,66,0.25)))';
    const loadouts = parseOpggLoadouts(content, "top");

    expect(loadouts).toHaveLength(4);
    expect(loadouts[0]?.build).toEqual(["Objeto uno", "Objeto dos", "Objeto tres"]);
    expect(loadouts[1]?.build).toEqual(["Objeto uno", "Objeto dos", "Objeto tres", "Cuarto A"]);
    expect(loadouts[3]?.build).toEqual(["Objeto uno", "Objeto dos", "Objeto tres", "Quinto"]);
    expect(loadouts[0]?.boots?.map((item) => item.name)).toEqual(["Botas"]);
    expect(loadouts[0]?.starterItems?.map((item) => item.name)).toEqual(["Inicio"]);
    expect(loadouts.every((loadout) => loadout.runes.primary === "Precisión · Conquistador")).toBe(true);
    expect(loadouts[0]?.metaScore).toBeGreaterThan(60);
  });

  it("extrae alternativas reales del snapshot de Gnar top", () => {
    const gnar = getChampionById("gnar");
    expect(gnar).not.toBeNull();

    const loadouts = getOpggLoadouts(gnar!, "top");
    expect(loadouts.length).toBeGreaterThanOrEqual(3);
    expect(loadouts[0]?.label).toBe("Meta OP.GG · core");
    expect(loadouts[1]?.build.length).toBeGreaterThan(loadouts[0]?.build.length ?? 0);
  });

  it("elimina objetos duplicados entre el core y su continuación", () => {
    const content = 'LolGetChampionAnalysis(Data(CoreItems(["Hidra titánica","Amanecer y anochecer","Malla de espinas"],100,55,0.2),[CoreItems(["Malla de espinas"],20,12,0.1)],[CoreItems(["Rostro espiritual"],20,11,0.08)],Runes("Valor",["Garras del inmortal"],"Inspiración",["Entrega de galletas"],[5005,5008,5001],120,66,0.25)))';
    const loadouts = parseOpggLoadouts(content, "top");

    expect(loadouts[0]?.build).toEqual(["Hidra titánica", "Amanecer y anochecer", "Malla de espinas"]);
    expect(loadouts[1]?.build).toEqual(["Hidra titánica", "Amanecer y anochecer", "Malla de espinas", "Rostro espiritual"]);
  });

  it("descarta una alternativa que queda idéntica al core tras normalizarse", () => {
    const content = 'LolGetChampionAnalysis(Data(CoreItems(["Cintomisil hextech","Mandato imperial","Reloj de arena de Zhonya"],100,55,0.2),[CoreItems(["Sombrero mortal de Rabadon"],20,12,0.1)],[CoreItems(["Reloj de arena de Zhonya"],40,24,0.3)],Runes("Brujería",["Cometa arcano"],"Valor",["Inquebrantable"],[5008,5008,5011],120,66,0.25)))';
    const loadouts = parseOpggLoadouts(content, "mid");

    expect(loadouts).toHaveLength(1);
    expect(loadouts[0]?.label).toBe("Meta OP.GG · core");
  });

  it("usa el dataset ampliado para campeones fuera del pool curado", () => {
    const viktor = getChampionById("viktor");
    expect(viktor).not.toBeNull();

    const loadouts = getOpggLoadouts(viktor!, "mid");
    expect(loadouts.length).toBeGreaterThan(0);
    expect(loadouts[0]?.build.length).toBeGreaterThan(0);
  });
});
