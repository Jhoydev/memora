import type { DraftRole, LeagueItemReference } from "./lol-draft.types";

export type LivePlayerScore = {
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  wardScore: number;
};

export type LivePlayerSnapshot = {
  championName: string;
  role: DraftRole | null;
  roleSource: "live-client" | "inferred" | "unknown";
  team: string | null;
  level: number;
  scores: LivePlayerScore;
  items: LeagueItemReference[];
  visibleInventoryGold: number | null;
  inventoryGoldSource: "data-dragon" | "live-client" | "unavailable";
  isDead: boolean;
  respawnTimer: number;
};

export type LiveGameSnapshot = {
  status: "in-game" | "not-in-game";
  championName: string | null;
  currentGold: number | null;
  gameTime: number | null;
  items: string[];
  itemReferences: LeagueItemReference[];
  activePlayer: LivePlayerSnapshot | null;
  laneOpponent: LivePlayerSnapshot | null;
  allies: LivePlayerSnapshot[];
  enemies: LivePlayerSnapshot[];
};

export type GamePhase = "opening" | "laning" | "transition" | "macro";
export type LaneAdvantage = "dominant" | "ahead" | "even" | "behind" | "critical" | "unknown";
export type CoachConfidence = "high" | "medium" | "low";
export type PlanPosture = "aggressive" | "controlled" | "defensive";

export type LiveCoachFactor = {
  id: "level" | "farm" | "combat" | "inventory";
  points: number;
  label: string;
};

export type TeamPriorityTarget = {
  championName: string;
  role: DraftRole | null;
  isActivePlayer: boolean;
  reason: string;
};

export type TeamPriorities = {
  strongestAlly: TeamPriorityTarget | null;
  strongestEnemy: TeamPriorityTarget | null;
  allyAction: string | null;
  enemyAction: string | null;
  buildAdjustment: string | null;
};

export type InGameCoachAnalysis = {
  phase: GamePhase;
  advantage: LaneAdvantage;
  posture: PlanPosture;
  score: number;
  confidence: CoachConfidence;
  opponentName: string | null;
  title: string;
  summary: string;
  actions: string[];
  avoid: string;
  factors: LiveCoachFactor[];
  matchup: {
    source: "specific" | "archetype" | "unknown";
    label: string;
    summary: string;
  };
  teamPriorities: TeamPriorities;
};
