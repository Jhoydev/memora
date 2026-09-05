import type { DraftRole, GeneratedChampionGuide } from "../domain/lol-draft.types";

type GuideRequest = {
  championName: string;
  role: DraftRole;
  allies: string[];
  enemies: string[];
};

type CachedGuide = {
  guide: GeneratedChampionGuide;
  expiresAt: number;
};

const GUIDE_CACHE_TTL_MS = 30 * 60 * 1000;
const guideCache = new Map<string, CachedGuide>();

const GUIDE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["build", "runes", "rationale"],
  properties: {
    build: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
    runes: {
      type: "object",
      additionalProperties: false,
      required: ["primary", "secondary", "shards"],
      properties: {
        primary: { type: "string" },
        secondary: { type: "string" },
        shards: { type: "string" },
      },
    },
    rationale: { type: "string", maxLength: 180 },
  },
} as const;

function getCacheKey(request: GuideRequest) {
  return [request.championName, request.role, ...request.allies, "vs", ...request.enemies].join("|");
}

function isGuide(value: unknown): value is GeneratedChampionGuide {
  if (!value || typeof value !== "object") return false;
  const guide = value as GeneratedChampionGuide;
  return Array.isArray(guide.build)
    && guide.build.length === 3
    && guide.build.every((item) => typeof item === "string")
    && typeof guide.runes?.primary === "string"
    && typeof guide.runes.secondary === "string"
    && typeof guide.runes.shards === "string"
    && typeof guide.rationale === "string";
}

function getOutputText(response: unknown) {
  const payload = response as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };
  if (typeof payload.output_text === "string") return payload.output_text;

  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .find((text): text is string => typeof text === "string") ?? null;
}

export async function getGeneratedChampionGuide(request: GuideRequest) {
  const cacheKey = getCacheKey(request);
  const cachedGuide = guideCache.get(cacheKey);
  if (cachedGuide && cachedGuide.expiresAt > Date.now()) return cachedGuide.guide;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no esta configurada.");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      store: false,
      max_output_tokens: 220,
      instructions: "Eres un analista experto de League of Legends. Devuelve una guia corta y util para el draft. No inventes campeones ni objetos. Usa nombres de objetos y runas en espanol. La build debe tener exactamente tres objetos principales. Considera la composicion, pero no afirmes datos de parche en tiempo real.",
      input: `Campeon: ${request.championName}\nLinea: ${request.role}\nAliados: ${request.allies.join(", ") || "ninguno"}\nRivales: ${request.enemies.join(", ") || "ninguno"}`,
      text: {
        format: {
          type: "json_schema",
          name: "champion_guide",
          strict: true,
          schema: GUIDE_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) throw new Error("OpenAI no pudo generar la guia.");

  const outputText = getOutputText(await response.json());
  if (!outputText) throw new Error("OpenAI no devolvio una guia.");

  const guide = JSON.parse(outputText) as unknown;
  if (!isGuide(guide)) throw new Error("OpenAI devolvio una guia invalida.");

  guideCache.set(cacheKey, { guide, expiresAt: Date.now() + GUIDE_CACHE_TTL_MS });
  return guide;
}
