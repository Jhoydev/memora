import { afterEach, describe, expect, it, vi } from "vitest";
import { getOpggChampionGuide } from "./opgg-champion-guide.service";

describe("getOpggChampionGuide", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adapta la respuesta MCP de OP.GG a la guia que usa la interfaz", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      result: {
        content: [{
          type: "text",
          text: 'class Data: core_items,runes\nData(CoreItems(["Cuchilla negra","Guantelete de hielo","Calibrador de Sterak"],1628,0.13),Runes("Valor",["Garras del inmortal","Demoler"],"Precisión",["Claridad mental","Último esfuerzo"],[5008,5008,5001]))',
        }],
      },
    })));
    vi.stubGlobal("fetch", fetchMock);

    const guide = await getOpggChampionGuide("Illaoi", "top");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(guide.build).toEqual(["Cuchilla negra", "Guantelete de hielo", "Calibrador de Sterak"]);
    expect(guide.runes.primary).toBe("Valor · Garras del inmortal · Demoler");
    expect(guide.runes.secondary).toBe("Precisión · Claridad mental · Último esfuerzo");
    expect(guide.runes.shards).toBe("Fuerza adaptable · Fuerza adaptable · Vida");
  });
});
