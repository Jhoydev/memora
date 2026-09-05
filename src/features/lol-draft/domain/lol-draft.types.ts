export const DRAFT_ROLES = ["top", "jungle", "mid", "adc", "support"] as const;

export type DraftRole = (typeof DRAFT_ROLES)[number];

export type ChampionTag =
  | "ad"
  | "ap"
  | "frontline"
  | "engage"
  | "peel"
  | "poke"
  | "pick"
  | "burst"
  | "sustain"
  | "dive"
  | "tank-shred"
  | "split";

export type DamageProfile = {
  physical: "primary" | "secondary" | "none";
  magic: "primary" | "secondary" | "none";
  true: "primary" | "secondary" | "none";
};

export type RecommendationFactor = {
  id: "champion-strength" | "damage-profile" | "team-needs" | "ally-synergy" | "win-condition" | "enemy-response" | "lane-matchup" | "redundancy";
  points: number;
  label: string;
};

export type RecommendationScope = "team" | "partial-draft" | "draft";

/** Canonical identity returned by Riot's champion catalog / Data Dragon. */
export type ChampionIdentity = {
  dataDragonId?: string;
  riotChampionKey?: number;
};

/** Display text remains available while external IDs are imported incrementally. */
export type LeagueItemReference = {
  id?: number;
  name: string;
  /** Full shop value when Data Dragon can resolve the item. */
  totalGold?: number;
};

/** Recipe metadata resolved from Riot Data Dragon for an actionable shop recommendation. */
export type LeagueItemPurchaseDetail = {
  item: LeagueItemReference;
  totalGold: number | null;
  components: LeagueItemPurchaseDetail[];
};

export type LeagueRuneReference = {
  id?: number;
  name: string;
};

export type RuneSelection = {
  primaryTree?: LeagueRuneReference;
  primaryRunes: LeagueRuneReference[];
  secondaryTree?: LeagueRuneReference;
  secondaryRunes: LeagueRuneReference[];
  shardIds: number[];
};

export type SummonerSpellReference = {
  id?: string;
  name: string;
};

export type ChampionAbilityData = {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  cooldown: string;
  cost: string;
  range: string;
};

export type ChampionPassiveData = {
  name: string;
  description: string;
  image: string;
};

export type Champion = {
  id: string;
  name: string;
  identity?: ChampionIdentity;
  roles: DraftRole[];
  tags: ChampionTag[];
  /** Optional explicit profile for kits whose true or hybrid damage matters to draft decisions. */
  damageProfile?: DamageProfile;
  style: string;
  build: string[];
  buildItems?: LeagueItemReference[];
  runes: {
    primary: string;
    secondary: string;
    shards: string;
  };
  runeSelection?: RuneSelection;
  loadouts?: ChampionLoadout[];
};

export type ChampionLoadout = {
  id: string;
  label: string;
  build: string[];
  buildItems?: LeagueItemReference[];
  /** The statistically preferred opening purchase, when the source exposes it. */
  starterItems?: LeagueItemReference[];
  boots?: LeagueItemReference[];
  runes: Champion["runes"];
  runeSelection?: RuneSelection;
  against?: ChampionTag;
  metaScore?: number;
  rationale: string;
};

export type DraftBoard = Record<DraftRole, string | null>;

export type ChampionRecommendation = {
  champion: Champion;
  score: number;
  reasons: string[];
  factors: RecommendationFactor[];
  scope: RecommendationScope;
  isOutsidePool?: boolean;
};

export type GeneratedChampionGuide = {
  build: string[];
  buildItems?: LeagueItemReference[];
  runes: {
    primary: string;
    secondary: string;
    shards: string;
  };
  runeSelection?: RuneSelection;
  rationale: string;
};
