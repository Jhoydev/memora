import { describe, expect, it } from "vitest";
import { EMPTY_DRAFT_BOARD } from "./lol-draft-data";
import { PLAYER_CHAMPION_POOL } from "./lol-draft-data";
import { getChampionById, getChampionFit, getChampionsForRole, recommendChampions } from "./lol-draft.service";

describe("recommendChampions", () => {
  it("prioriza peel para ADC contra una composición de dive", () => {
    const recommendations = recommendChampions(
      "adc",
      { ...EMPTY_DRAFT_BOARD, top: "ornn" },
      { ...EMPTY_DRAFT_BOARD, jungle: "jarvan-iv", mid: "ahri" },
    );

    expect(recommendations[0]?.champion.id).toBe("xayah");
    expect(recommendations[0]?.reasons).toContain("Protege al carry contra el dive rival.");
  });

  it("no recomienda campeones ya bloqueados", () => {
    const recommendations = recommendChampions(
      "mid",
      { ...EMPTY_DRAFT_BOARD, mid: "ahri" },
      EMPTY_DRAFT_BOARD,
    );

    expect(recommendations.map(({ champion }) => champion.id)).not.toContain("ahri");
  });

  it("excluye los campeones baneados de las recomendaciones", () => {
    const recommendations = recommendChampions(
      "top",
      EMPTY_DRAFT_BOARD,
      EMPTY_DRAFT_BOARD,
      ["malphite", "sett", "gnar"],
      ["malphite", "sett"],
    );

    expect(recommendations.map(({ champion }) => champion.id)).not.toContain("malphite");
    expect(recommendations.map(({ champion }) => champion.id)).not.toContain("sett");
  });

  it("usa picks rivales sin línea conocida para el cálculo de composición", () => {
    const withoutUnassignedEnemy = recommendChampions(
      "adc",
      EMPTY_DRAFT_BOARD,
      EMPTY_DRAFT_BOARD,
    );
    const recommendations = recommendChampions(
      "adc",
      EMPTY_DRAFT_BOARD,
      EMPTY_DRAFT_BOARD,
      undefined,
      [],
      ["nocturne"],
    );

    const xayahWithoutEnemy = withoutUnassignedEnemy.find(({ champion }) => champion.id === "xayah");
    const xayahWithEnemy = recommendations.find(({ champion }) => champion.id === "xayah");
    expect(xayahWithEnemy?.score).toBeGreaterThan(xayahWithoutEnemy?.score ?? 0);
    expect(xayahWithEnemy?.reasons).toContain("Protege al carry contra el dive rival.");
  });

  it("ofrece meta legal si los bans agotan el pool personal", () => {
    const recommendations = recommendChampions(
      "adc",
      EMPTY_DRAFT_BOARD,
      EMPTY_DRAFT_BOARD,
      PLAYER_CHAMPION_POOL.adc,
      PLAYER_CHAMPION_POOL.adc,
    );

    expect(recommendations).toHaveLength(3);
    expect(recommendations.every(({ champion }) => !PLAYER_CHAMPION_POOL.adc.includes(champion.id))).toBe(true);
    expect(recommendations.every(({ isOutsidePool }) => isOutsidePool)).toBe(true);
  });

  it("incluye Aurora como opcion de top y mid", () => {
    expect(getChampionsForRole("top").map(({ id }) => id)).toContain("aurora");
    expect(getChampionsForRole("mid").map(({ id }) => id)).toContain("aurora");
  });

  it("incluye Illaoi como opcion de top", () => {
    expect(getChampionsForRole("top").map(({ id }) => id)).toContain("illaoi");
  });

  it("importa perfiles de meta para las cinco líneas, no solo top", () => {
    expect(getChampionsForRole("jungle").length).toBeGreaterThan(50);
    expect(getChampionsForRole("mid").length).toBeGreaterThan(45);
    expect(getChampionsForRole("adc").length).toBeGreaterThan(35);
    expect(getChampionsForRole("support").length).toBeGreaterThan(40);
  });

  it("enriquece los perfiles importados con señales amplias de Riot", () => {
    const darius = getChampionById("darius");

    expect(darius?.identity?.dataDragonId).toBe("Darius");
    expect(darius?.tags).toEqual(expect.arrayContaining(["ad", "frontline", "sustain"]));
  });

  it("calcula el fit de un pick ya bloqueado sin contarlo dos veces", () => {
    const fit = getChampionFit(
      "top",
      "mordekaiser",
      { ...EMPTY_DRAFT_BOARD, top: "mordekaiser", jungle: "nocturne", mid: "ahri" },
      EMPTY_DRAFT_BOARD,
    );

    expect(fit?.champion.id).toBe("mordekaiser");
    expect(fit?.score).toBeGreaterThan(0);
  });

  it("limita las sugerencias al pool personal cuando se indica", () => {
    const recommendations = recommendChampions("adc", EMPTY_DRAFT_BOARD, EMPTY_DRAFT_BOARD, PLAYER_CHAMPION_POOL.adc);
    const poolRecommendations = recommendations.filter(({ isOutsidePool }) => !isOutsidePool);

    expect(poolRecommendations.map(({ champion }) => champion.id)).not.toContain("kaisa");
    expect(poolRecommendations.every(({ champion }) => PLAYER_CHAMPION_POOL.adc.includes(champion.id))).toBe(true);
  });

  it("usa el meta de la línea cuando todavía no existe un pool personal", () => {
    const recommendations = recommendChampions("mid", EMPTY_DRAFT_BOARD, EMPTY_DRAFT_BOARD, []);

    expect(recommendations).toHaveLength(3);
    expect(recommendations.every(({ champion }) => champion.roles.includes("mid"))).toBe(true);
  });

  it("penaliza frontline adicional aunque una alternativa externa cubra otra necesidad", () => {
    const recommendations = recommendChampions(
      "top",
      { ...EMPTY_DRAFT_BOARD, jungle: "shen", support: "sion" },
      EMPTY_DRAFT_BOARD,
      ["malphite", "aurelion-sol", "sett"],
    );

    expect(recommendations.find(({ champion }) => champion.id === "malphite")?.score)
      .toBeLessThan(recommendations.find(({ champion }) => champion.id === "aurelion-sol")?.score ?? Infinity);
  });

  it("prioriza daño AD cuando Ahri y Ziggs dejan al equipo cargado de AP", () => {
    const recommendations = recommendChampions(
      "top",
      { ...EMPTY_DRAFT_BOARD, jungle: "nocturne", mid: "ahri", adc: "ziggs", support: "shen" },
      EMPTY_DRAFT_BOARD,
      ["aurelion-sol", "sett", "malphite"],
    );

    expect(recommendations[0]?.champion.id).toBe("camille");
    expect(recommendations[0]?.isOutsidePool).toBe(true);
    expect(recommendations[0]?.factors).toContainEqual(expect.objectContaining({
      id: "damage-profile",
      label: "Añade una amenaza física donde el equipo está cargado de daño mágico.",
    }));
  });

  it("incluye solo una alternativa externa cuando supera al mejor pick del pool", () => {
    const recommendations = recommendChampions(
      "top",
      { ...EMPTY_DRAFT_BOARD, jungle: "nocturne", mid: "ahri", adc: "ziggs", support: "shen" },
      EMPTY_DRAFT_BOARD,
      ["aurelion-sol", "malphite"],
    );

    const outsidePool = recommendations.filter(({ isOutsidePool }) => isOutsidePool);
    expect(outsidePool).toHaveLength(1);
    expect(outsidePool[0]?.champion.id).toBe("camille");
    expect(outsidePool[0]?.score).toBeGreaterThan(recommendations.find(({ champion }) => champion.id === "aurelion-sol")?.score ?? 0);
  });

  it("distingue el encaje de equipo de un draft con enemigos todavía ocultos", () => {
    const teamOnly = getChampionFit(
      "top",
      "camille",
      { ...EMPTY_DRAFT_BOARD, jungle: "gwen", mid: "galio", adc: "kaisa", support: "leona" },
      EMPTY_DRAFT_BOARD,
    );
    const partialDraft = getChampionFit(
      "top",
      "camille",
      { ...EMPTY_DRAFT_BOARD, jungle: "gwen", mid: "galio", adc: "kaisa", support: "leona" },
      EMPTY_DRAFT_BOARD,
      ["darius"],
    );

    expect(teamOnly?.scope).toBe("team");
    expect(partialDraft?.scope).toBe("partial-draft");
    expect(teamOnly?.factors.some((factor) => factor.id === "win-condition")).toBe(true);
  });

  it("usa solo el Top confirmado para el matchup directo", () => {
    const againstEnemyMid = getChampionFit(
      "top",
      "gnar",
      EMPTY_DRAFT_BOARD,
      { ...EMPTY_DRAFT_BOARD, mid: "malphite" },
    );
    const againstEnemyTop = getChampionFit(
      "top",
      "gnar",
      EMPTY_DRAFT_BOARD,
      { ...EMPTY_DRAFT_BOARD, top: "malphite" },
    );

    expect(againstEnemyMid?.factors.some((factor) => factor.id === "lane-matchup")).toBe(false);
    expect(againstEnemyTop?.factors).toContainEqual(expect.objectContaining({ id: "lane-matchup" }));
  });
});
