import { afterEach, describe, expect, it, vi } from "vitest";
import { lolAssets } from "./lol-assets.service";
import { dataDragonAssetProvider, getDataDragonChampionProfile, getDataDragonItemReference, getDataDragonRuneReference, getDataDragonSummonerSpellReference } from "./data-dragon-assets.service";

const version = "15.1.1";

describe("Data Dragon asset provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normaliza campeones y resuelve assets de campeón, objeto, runa, hechizo y pasiva", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/api/versions.json")) return Response.json([version]);
      if (url.includes("champion.json")) {
        return Response.json({
          data: {
            MonkeyKing: { id: "MonkeyKing", key: "62", name: "Wukong", image: { full: "MonkeyKing.png" } },
            KSante: { id: "KSante", key: "897", name: "K'Sante", image: { full: "KSante.png" } },
          },
        });
      }
      if (url.includes("champion/MonkeyKing.json")) {
        return Response.json({ data: { MonkeyKing: { passive: { name: "Golpes aplastantes", description: "Descripción de pasiva", image: { full: "MonkeyKingPassive.png" } }, spells: [{ id: "MonkeyKingQ", name: "Golpe aplastante", description: "Descripción Q", tooltip: "Tooltip Q", cooldownBurn: "9/8/7", costBurn: "40", rangeBurn: "300", image: { full: "MonkeyKingDoubleAttack.png" } }] } } });
      }
      if (url.includes("item.json")) {
        return Response.json({ data: { 3078: { name: "Fuerza de trinidad", image: { full: "3078.png" } } } });
      }
      if (url.includes("runesReforged.json")) {
        return Response.json([{ id: 8000, name: "Precisión", slots: [{ runes: [{ id: 8021, name: "Pies veloces", icon: "perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png" }] }] }]);
      }
      if (url.includes("summoner.json")) {
        return Response.json({ data: { SummonerFlash: { id: "SummonerFlash", name: "Destello", image: { full: "SummonerFlash.png" } } } });
      }
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(dataDragonAssetProvider.resolveChampion({ name: "Wukong" })).resolves.toBe(
      `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/MonkeyKing.png`,
    );
    await expect(dataDragonAssetProvider.resolveChampion({ key: 897 })).resolves.toBe(
      `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/KSante.png`,
    );
    await expect(dataDragonAssetProvider.resolveItem(3078)).resolves.toBe(
      `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/3078.png`,
    );
    await expect(dataDragonAssetProvider.resolveRune(8021)).resolves.toBe(
      "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png",
    );
    await expect(dataDragonAssetProvider.resolveSpell("SummonerFlash")).resolves.toBe(
      `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/SummonerFlash.png`,
    );
    await expect(dataDragonAssetProvider.resolveAbility({ champion: { name: "Wukong" }, id: "MonkeyKingQ" })).resolves.toBe(
      `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/MonkeyKingDoubleAttack.png`,
    );
    await expect(dataDragonAssetProvider.resolvePassive("Annie_Passive.png")).resolves.toBe(
      `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/Annie_Passive.png`,
    );

    await expect(getDataDragonChampionProfile({ name: "Wukong" })).resolves.toMatchObject({
      identity: { dataDragonId: "MonkeyKing", riotChampionKey: 62, name: "Wukong" },
      passive: { name: "Golpes aplastantes", image: "MonkeyKingPassive.png" },
      abilities: [{ id: "MonkeyKingQ", cooldown: "9/8/7", cost: "40", range: "300" }],
    });
    await expect(getDataDragonItemReference("Fuerza de trinidad")).resolves.toEqual({ id: 3078, name: "Fuerza de trinidad" });
    await expect(getDataDragonRuneReference("Pies veloces")).resolves.toEqual({ id: 8021, name: "Pies veloces" });
    await expect(getDataDragonSummonerSpellReference("SummonerFlash")).resolves.toEqual({ id: "SummonerFlash", name: "Destello" });

    expect(fetchMock.mock.calls.filter(([input]) => String(input).endsWith("/api/versions.json"))).toHaveLength(1);
  });

  it("expone URLs internas estables para que los componentes no conozcan Data Dragon", () => {
    expect(lolAssets.champion({ id: "MonkeyKing", key: 62, name: "Wukong" })).toBe(
      "/api/lol-assets/champion?id=MonkeyKing&key=62&name=Wukong",
    );
    expect(lolAssets.item(3078)).toBe("/api/lol-assets/item?id=3078");
    expect(lolAssets.rune({ id: 8021 })).toBe("/api/lol-assets/rune?id=8021");
  });
});
