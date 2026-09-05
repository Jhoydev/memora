export type LolAssetType = "champion" | "item" | "rune" | "spell" | "ability" | "passive";

export type LolChampionReference = {
  id?: string;
  key?: number | string;
  name?: string;
};

export type LolItemReference = number | string | { id?: number | string; name?: string };

export type LolRuneReference = number | string | { id?: number | string; name?: string };

export type LolSpellReference = string | { id?: string; name?: string; image?: string };

export type LolChampionAbilityReference = {
  champion: LolChampionReference;
  id?: string;
  name?: string;
  image?: string;
};

export type LolPassiveReference = string | { image: string };

export type LolChampionAbility = {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  cooldown: string;
  cost: string;
  range: string;
};

export type LolChampionPassive = {
  name: string;
  description: string;
  image: string;
};

export type LolChampionProfile = {
  identity: {
    dataDragonId: string;
    riotChampionKey: number;
    name: string;
  };
  passive: LolChampionPassive | null;
  abilities: LolChampionAbility[];
};

export type LolAssetReference =
  | LolChampionReference
  | LolItemReference
  | LolRuneReference
  | LolSpellReference
  | LolChampionAbilityReference
  | LolPassiveReference;

export interface LolAssetProvider {
  resolveChampion(reference: LolChampionReference): Promise<string | null>;
  resolveItem(reference: LolItemReference): Promise<string | null>;
  resolveRune(reference: LolRuneReference): Promise<string | null>;
  resolveSpell(reference: LolSpellReference): Promise<string | null>;
  resolveAbility(reference: LolChampionAbilityReference): Promise<string | null>;
  resolvePassive(reference: LolPassiveReference): Promise<string | null>;
}
