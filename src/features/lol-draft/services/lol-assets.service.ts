import type {
  LolAssetType,
  LolChampionAbilityReference,
  LolChampionReference,
  LolItemReference,
  LolPassiveReference,
  LolRuneReference,
  LolSpellReference,
} from "../domain/lol-assets.types";

function toAssetUrl(type: LolAssetType, reference: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(reference)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  return `/api/lol-assets/${type}?${params.toString()}`;
}

function toIdentifiableReference(reference: LolItemReference | LolRuneReference) {
  return typeof reference === "object" ? reference : { id: reference };
}

function toSpellReference(reference: LolSpellReference) {
  return typeof reference === "string" ? { id: reference } : reference;
}

function toPassiveReference(reference: LolPassiveReference) {
  return typeof reference === "string" ? { image: reference } : reference;
}

function toChampionDetailsUrl(reference: LolChampionReference) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(reference)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  return `/api/lol-assets/champion-details?${params.toString()}`;
}

/**
 * Client-safe asset API. Components only know these internal URLs; the provider is resolved server-side.
 */
export const lolAssets = {
  champion(reference: LolChampionReference) {
    return toAssetUrl("champion", reference);
  },
  item(reference: LolItemReference) {
    return toAssetUrl("item", toIdentifiableReference(reference));
  },
  itemDetails(references: Array<{ id?: number; name: string }>) {
    const params = new URLSearchParams({ items: JSON.stringify(references) });
    return `/api/lol-assets/item-details?${params.toString()}`;
  },
  rune(reference: LolRuneReference) {
    return toAssetUrl("rune", toIdentifiableReference(reference));
  },
  spell(reference: LolSpellReference) {
    return toAssetUrl("spell", toSpellReference(reference));
  },
  ability(reference: LolChampionAbilityReference) {
    return toAssetUrl("ability", {
      championId: reference.champion.id,
      championKey: reference.champion.key,
      championName: reference.champion.name,
      id: reference.id,
      name: reference.name,
      image: reference.image,
    });
  },
  championDetails(reference: LolChampionReference) {
    return toChampionDetailsUrl(reference);
  },
  passive(reference: LolPassiveReference) {
    return toAssetUrl("passive", toPassiveReference(reference));
  },
  fallback(type: LolAssetType) {
    return `/api/lol-assets/fallback?type=${type}`;
  },
};
