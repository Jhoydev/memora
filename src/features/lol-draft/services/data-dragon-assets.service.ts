import type {
  LolAssetProvider,
  LolChampionAbility,
  LolChampionProfile,
  LolChampionAbilityReference,
  LolAssetReference,
  LolAssetType,
  LolChampionReference,
  LolItemReference,
  LolPassiveReference,
  LolRuneReference,
  LolSpellReference,
} from "../domain/lol-assets.types";
import type {
  LeagueItemReference,
  LeagueItemPurchaseDetail,
  LeagueRuneReference,
  SummonerSpellReference,
} from "../domain/lol-draft.types";

export const DATA_DRAGON_CONFIG = {
  baseUrl: "https://ddragon.leagueoflegends.com",
  locale: "es_ES",
  metadataCacheMs: 24 * 60 * 60 * 1000,
  versionCacheMs: 6 * 60 * 60 * 1000,
} as const;

type CachedValue<T> = { expiresAt: number; value: T };

type DataDragonImage = { full?: string };
type DataDragonChampion = { id: string; key: string; name: string; image?: DataDragonImage };
type DataDragonChampionDetails = {
  passive?: { name?: string; description?: string; image?: DataDragonImage };
  spells?: DataDragonSpell[];
};
type DataDragonItem = {
  name: string;
  image?: DataDragonImage;
  from?: string[];
  gold?: { total?: number };
};
type DataDragonSpell = {
  id: string;
  name: string;
  description?: string;
  tooltip?: string;
  cooldownBurn?: string;
  costBurn?: string;
  rangeBurn?: string;
  image?: DataDragonImage;
};
type DataDragonRune = { id: number; name: string; icon?: string; slots?: Array<{ runes: DataDragonRune[] }> };

const metadataCache = new Map<string, CachedValue<unknown>>();

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function getFilename(value: string | undefined) {
  if (!value) return null;
  const filename = value.split("/").at(-1);
  return filename && /^[a-zA-Z0-9_.-]+$/.test(filename) ? filename : null;
}

async function getCachedJson<T>(key: string, path: string, cacheMs: number) {
  const cached = metadataCache.get(key) as CachedValue<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const response = await fetch(`${DATA_DRAGON_CONFIG.baseUrl}${path}`, {
    next: { revalidate: Math.floor(cacheMs / 1000) },
  });
  if (!response.ok) throw new Error(`Data Dragon respondió ${response.status}.`);

  const value = (await response.json()) as T;
  metadataCache.set(key, { value, expiresAt: Date.now() + cacheMs });
  return value;
}

async function getVersion() {
  const versions = await getCachedJson<string[]>(
    "versions",
    "/api/versions.json",
    DATA_DRAGON_CONFIG.versionCacheMs,
  );
  const version = versions[0];
  if (!version) throw new Error("Data Dragon no devolvió una versión.");
  return version;
}

async function getChampionMetadata(version: string) {
  return getCachedJson<{ data: Record<string, DataDragonChampion> }>(
    `champions:${version}:${DATA_DRAGON_CONFIG.locale}`,
    `/cdn/${version}/data/${DATA_DRAGON_CONFIG.locale}/champion.json`,
    DATA_DRAGON_CONFIG.metadataCacheMs,
  );
}

async function getChampionDetails(version: string, championId: string) {
  return getCachedJson<{ data: Record<string, DataDragonChampionDetails> }>(
    `champion-details:${version}:${DATA_DRAGON_CONFIG.locale}:${championId}`,
    `/cdn/${version}/data/${DATA_DRAGON_CONFIG.locale}/champion/${championId}.json`,
    DATA_DRAGON_CONFIG.metadataCacheMs,
  );
}

async function getItemMetadata(version: string) {
  return getCachedJson<{ data: Record<string, DataDragonItem> }>(
    `items:${version}:${DATA_DRAGON_CONFIG.locale}`,
    `/cdn/${version}/data/${DATA_DRAGON_CONFIG.locale}/item.json`,
    DATA_DRAGON_CONFIG.metadataCacheMs,
  );
}

async function getRuneMetadata(version: string) {
  return getCachedJson<DataDragonRune[]>(
    `runes:${version}:${DATA_DRAGON_CONFIG.locale}`,
    `/cdn/${version}/data/${DATA_DRAGON_CONFIG.locale}/runesReforged.json`,
    DATA_DRAGON_CONFIG.metadataCacheMs,
  );
}

async function getSpellMetadata(version: string) {
  return getCachedJson<{ data: Record<string, DataDragonSpell> }>(
    `spells:${version}:${DATA_DRAGON_CONFIG.locale}`,
    `/cdn/${version}/data/${DATA_DRAGON_CONFIG.locale}/summoner.json`,
    DATA_DRAGON_CONFIG.metadataCacheMs,
  );
}

function findChampion(champions: Record<string, DataDragonChampion>, reference: LolChampionReference) {
  const values = Object.values(champions);
  const key = reference.key === undefined ? undefined : String(reference.key);

  return values.find((champion) => champion.id === reference.id || champion.key === key || champion.name === reference.name)
    ?? values.find((champion) => (
      (reference.id && normalize(champion.id) === normalize(reference.id))
      || (reference.name && normalize(champion.name) === normalize(reference.name))
    ))
    ?? null;
}

function findByIdOrName<T extends { name: string }>(records: Record<string, T>, reference: LolItemReference | LolRuneReference) {
  const normalizedReference = typeof reference === "object" ? reference : { id: reference, name: reference };
  const id = normalizedReference.id === undefined ? undefined : String(normalizedReference.id);
  const values = Object.values(records);

  return (id ? records[id] ?? null : null)
    ?? values.find((record) => record.name === normalizedReference.name)
    ?? values.find((record) => normalizedReference.name && normalize(record.name) === normalize(String(normalizedReference.name)))
    ?? null;
}

function flattenRunes(runes: DataDragonRune[]) {
  return runes.flatMap((tree) => [tree, ...(tree.slots?.flatMap((slot) => slot.runes) ?? [])]);
}

function findRune(runes: DataDragonRune[], reference: LolRuneReference) {
  const normalizedReference = typeof reference === "object" ? reference : { id: reference, name: reference };
  const id = normalizedReference.id === undefined ? undefined : Number(normalizedReference.id);
  const allRunes = flattenRunes(runes);

  return allRunes.find((rune) => rune.id === id || rune.name === normalizedReference.name)
    ?? allRunes.find((rune) => normalizedReference.name && normalize(rune.name) === normalize(String(normalizedReference.name)))
    ?? null;
}

function findSpell(spells: Record<string, DataDragonSpell>, reference: LolSpellReference) {
  const normalizedReference = typeof reference === "string" ? { id: reference } : reference;
  if (normalizedReference.image) return { image: { full: normalizedReference.image } };

  return Object.values(spells).find((spell) => spell.id === normalizedReference.id || spell.name === normalizedReference.name)
    ?? Object.values(spells).find((spell) => normalizedReference.name && normalize(spell.name) === normalize(normalizedReference.name))
    ?? null;
}

function findAbility(abilities: DataDragonSpell[], reference: LolChampionAbilityReference) {
  if (reference.image) return { image: { full: reference.image } };

  return abilities.find((ability) => ability.id === reference.id || ability.name === reference.name)
    ?? abilities.find((ability) => reference.name && normalize(ability.name) === normalize(reference.name))
    ?? null;
}

async function getResolvedChampion(reference: LolChampionReference) {
  const version = await getVersion();
  const champion = findChampion((await getChampionMetadata(version)).data, reference);
  return champion ? { champion, version } : null;
}

function versionedAssetUrl(version: string, directory: "champion" | "item" | "spell" | "passive", image: string | undefined) {
  const filename = getFilename(image);
  return filename ? `${DATA_DRAGON_CONFIG.baseUrl}/cdn/${version}/img/${directory}/${filename}` : null;
}

export const dataDragonAssetProvider: LolAssetProvider = {
  async resolveChampion(reference) {
    const resolvedChampion = await getResolvedChampion(reference);
    return resolvedChampion ? versionedAssetUrl(resolvedChampion.version, "champion", resolvedChampion.champion.image?.full) : null;
  },
  async resolveItem(reference) {
    const version = await getVersion();
    const item = findByIdOrName((await getItemMetadata(version)).data, reference);
    return item ? versionedAssetUrl(version, "item", item.image?.full) : null;
  },
  async resolveRune(reference) {
    const version = await getVersion();
    const rune = findRune(await getRuneMetadata(version), reference);
    return rune?.icon ? `${DATA_DRAGON_CONFIG.baseUrl}/cdn/img/${rune.icon}` : null;
  },
  async resolveSpell(reference) {
    const version = await getVersion();
    const spell = findSpell((await getSpellMetadata(version)).data, reference);
    return spell ? versionedAssetUrl(version, "spell", spell.image?.full) : null;
  },
  async resolveAbility(reference) {
    const resolvedChampion = await getResolvedChampion(reference.champion);
    if (!resolvedChampion) return null;

    const details = await getChampionDetails(resolvedChampion.version, resolvedChampion.champion.id);
    const championDetails = details.data[resolvedChampion.champion.id];
    const ability = championDetails ? findAbility(championDetails.spells ?? [], reference) : null;
    return ability ? versionedAssetUrl(resolvedChampion.version, "spell", ability.image?.full) : null;
  },
  async resolvePassive(reference) {
    const version = await getVersion();
    const normalizedReference = typeof reference === "string" ? { image: reference } : reference;
    return versionedAssetUrl(version, "passive", normalizedReference.image);
  },
};

export async function getDataDragonChampionProfile(reference: LolChampionReference): Promise<LolChampionProfile | null> {
  const resolvedChampion = await getResolvedChampion(reference);
  if (!resolvedChampion) return null;

  const details = await getChampionDetails(resolvedChampion.version, resolvedChampion.champion.id);
  const championDetails = details.data[resolvedChampion.champion.id];
  const passive = championDetails?.passive;

  return {
    identity: {
      dataDragonId: resolvedChampion.champion.id,
      riotChampionKey: Number(resolvedChampion.champion.key),
      name: resolvedChampion.champion.name,
    },
    passive: passive?.name && passive.image?.full ? {
      name: passive.name,
      description: passive.description ?? "",
      image: passive.image.full,
    } : null,
    abilities: (championDetails?.spells ?? []).map((spell) => ({
      id: spell.id,
      name: spell.name,
      description: spell.description ?? "",
      tooltip: spell.tooltip ?? "",
      cooldown: spell.cooldownBurn ?? "",
      cost: spell.costBurn ?? "",
      range: spell.rangeBurn ?? "",
    })),
  };
}

export async function getDataDragonItemGoldValues(itemIds: number[]) {
  const version = await getVersion();
  const items = (await getItemMetadata(version)).data;

  return new Map(
    [...new Set(itemIds)].flatMap((itemId) => {
      const totalGold = items[String(itemId)]?.gold?.total;
      return typeof totalGold === "number" ? [[itemId, totalGold] as const] : [];
    }),
  );
}

/** Returns the official component tree used to explain the next shop purchase. */
export async function getDataDragonItemPurchaseDetails(references: LeagueItemReference[]) {
  const version = await getVersion();
  const items = (await getItemMetadata(version)).data;

  function resolve(reference: LeagueItemReference, visited = new Set<string>()): LeagueItemPurchaseDetail | null {
    const item = findByIdOrName(items, reference);
    if (!item) return null;

    const [id] = Object.entries(items).find(([, candidate]) => candidate === item) ?? [];
    if (!id || visited.has(id)) return null;
    const nextVisited = new Set(visited).add(id);
    const numericId = Number(id);
    const itemReference = {
      id: Number.isFinite(numericId) ? numericId : undefined,
      name: item.name,
      totalGold: item.gold?.total,
    } satisfies LeagueItemReference;

    return {
      item: itemReference,
      totalGold: typeof item.gold?.total === "number" ? item.gold.total : null,
      components: (item.from ?? []).flatMap((componentId) => resolve({ id: Number(componentId), name: items[componentId]?.name ?? componentId }, nextVisited) ?? []),
    };
  }

  return references.flatMap((reference) => resolve(reference) ?? []);
}

export async function getDataDragonChampionAbilities(reference: LolChampionReference): Promise<LolChampionAbility[]> {
  return (await getDataDragonChampionProfile(reference))?.abilities ?? [];
}

/** Enriches display-only imports with the stable Data Dragon object identifier. */
export async function getDataDragonItemReference(reference: LolItemReference): Promise<LeagueItemReference | null> {
  const version = await getVersion();
  const items = (await getItemMetadata(version)).data;
  const item = findByIdOrName(items, reference);
  if (!item) return null;

  const [id] = Object.entries(items).find(([, candidate]) => candidate === item) ?? [];
  const numericId = Number(id);
  return { id: Number.isFinite(numericId) ? numericId : undefined, name: item.name };
}

/** Preserves raw OP.GG rune names while resolving their canonical Riot IDs when available. */
export async function getDataDragonRuneReference(reference: LolRuneReference): Promise<LeagueRuneReference | null> {
  const rune = findRune(await getRuneMetadata(await getVersion()), reference);
  return rune ? { id: rune.id, name: rune.name } : null;
}

export async function getDataDragonSummonerSpellReference(reference: LolSpellReference): Promise<SummonerSpellReference | null> {
  const spell = findSpell((await getSpellMetadata(await getVersion())).data, reference);
  return spell && "id" in spell ? { id: spell.id, name: spell.name } : null;
}

export async function resolveDataDragonAsset(type: LolAssetType, reference: LolAssetReference) {
  switch (type) {
    case "champion":
      return dataDragonAssetProvider.resolveChampion(reference as LolChampionReference);
    case "item":
      return dataDragonAssetProvider.resolveItem(reference as LolItemReference);
    case "rune":
      return dataDragonAssetProvider.resolveRune(reference as LolRuneReference);
    case "spell":
      return dataDragonAssetProvider.resolveSpell(reference as LolSpellReference);
    case "ability":
      return dataDragonAssetProvider.resolveAbility(reference as LolChampionAbilityReference);
    case "passive":
      return dataDragonAssetProvider.resolvePassive(reference as LolPassiveReference);
  }
}
