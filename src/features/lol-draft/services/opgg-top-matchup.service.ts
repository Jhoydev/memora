import type { Champion } from "../domain/lol-draft.types";
import topSnapshot from "../data/opgg-top-champions.json";

type SnapshotAnalysis = { champion: string; content: string };

function normalizeChampionName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

export function getTopMatchupAdjustment(candidateName: string, enemies: Champion[]) {
  const analysis = ((topSnapshot.analyses ?? []) as SnapshotAnalysis[]).find(
    (entry) => normalizeChampionName(entry.champion) === normalizeChampionName(candidateName),
  );
  if (!analysis) return { score: 0, reason: null };

  const enemyNames = new Set(enemies.map((enemy) => normalizeChampionName(enemy.name)));
  const matchups = [...analysis.content.matchAll(/(?:StrongCounter|WeakCounter)\("([^"]+)",\d+,([\d.]+),([\d.]+)\)/g)]
    .filter((match) => enemyNames.has(normalizeChampionName(match[1]!)))
    .map((match) => ({ opponent: match[1]!, advantage: (Number(match[2]) - Number(match[3])) * 60 }));

  if (matchups.length === 0) return { score: 0, reason: null };

  const adjustment = Math.max(-12, Math.min(12, Math.round(matchups.reduce((score, matchup) => score + matchup.advantage, 0))));
  const strongest = matchups.sort((left, right) => Math.abs(right.advantage) - Math.abs(left.advantage))[0]!;
  if (adjustment === 0) return { score: 0, reason: null };

  return {
    score: adjustment,
    reason: adjustment > 0
      ? `OP.GG muestra un matchup favorable contra ${strongest.opponent}.`
      : `OP.GG muestra un matchup difícil contra ${strongest.opponent}.`,
  };
}
