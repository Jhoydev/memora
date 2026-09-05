import type {
  GamePhase,
  InGameCoachAnalysis,
  LaneAdvantage,
  LiveCoachFactor,
  LiveGameSnapshot,
  LivePlayerSnapshot,
  PlanPosture,
  TeamPriorities,
  TeamPriorityTarget,
} from "../domain/in-game-coach.types";
import { getLaneMatchupAdvice } from "./lane-matchup-playbook.service";
import { CHAMPIONS } from "./lol-draft-data";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export function getGamePhase(gameTime: number | null): GamePhase {
  const seconds = gameTime ?? 0;
  if (seconds < 5 * 60) return "opening";
  if (seconds < 14 * 60) return "laning";
  if (seconds < 20 * 60) return "transition";
  return "macro";
}

function getCombatValue(player: LivePlayerSnapshot) {
  return player.scores.kills * 1.5 + player.scores.assists * 0.5 - player.scores.deaths * 1.25;
}

function getAdvantage(score: number, previous?: LaneAdvantage): LaneAdvantage {
  if (previous === "dominant" && score >= 30) return "dominant";
  if (previous === "ahead" && score >= 9 && score < 40) return "ahead";
  if (previous === "even" && score > -19 && score < 19) return "even";
  if (previous === "behind" && score > -40 && score <= -9) return "behind";
  if (previous === "critical" && score <= -30) return "critical";

  if (score >= 35) return "dominant";
  if (score >= 14) return "ahead";
  if (score > -14) return "even";
  if (score > -35) return "behind";
  return "critical";
}

function getPosture(advantage: LaneAdvantage): PlanPosture {
  if (advantage === "dominant" || advantage === "ahead") return "aggressive";
  if (advantage === "behind" || advantage === "critical") return "defensive";
  return "controlled";
}

function factorLabel(label: string, delta: number, suffix = "") {
  return `${label} ${signed(delta)}${suffix}`;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function visiblePower(player: LivePlayerSnapshot, gameTime: number | null) {
  const minutes = Math.max((gameTime ?? 0) / 60, 3);
  const combat = getCombatValue(player);
  const inventory = player.visibleInventoryGold ?? 0;
  // CS contributes lightly because expected farm differs significantly by role.
  return player.level * 6 + (player.scores.creepScore / minutes) * 0.25 + combat * 4 + (inventory / 1000) * 3;
}

function strongestVisiblePlayer(players: LivePlayerSnapshot[], gameTime: number | null) {
  return players.reduce<LivePlayerSnapshot | null>((strongest, player) => (
    !strongest || visiblePower(player, gameTime) > visiblePower(strongest, gameTime) ? player : strongest
  ), null);
}

function priorityTarget(player: LivePlayerSnapshot, activePlayer: LivePlayerSnapshot | null, gameTime: number | null): TeamPriorityTarget {
  const minutes = Math.max((gameTime ?? 0) / 60, 3);
  const inventory = player.visibleInventoryGold === null ? "inventario parcial" : `${Math.round(player.visibleInventoryGold)} de inventario`;
  return {
    championName: player.championName,
    role: player.role,
    isActivePlayer: activePlayer?.championName === player.championName && activePlayer.team === player.team,
    reason: `Nivel ${player.level} · ${player.scores.creepScore} CS · ${player.scores.kills}/${player.scores.deaths}/${player.scores.assists} · ${inventory} · ${Math.round(player.scores.creepScore / minutes)} CS/min.`,
  };
}

function getChampionTags(championName: string) {
  return CHAMPIONS.find((champion) => normalize(champion.name) === normalize(championName))?.tags ?? [];
}

export function getTeamPriorities(snapshot: LiveGameSnapshot): TeamPriorities {
  const strongestAlly = strongestVisiblePlayer(snapshot.allies, snapshot.gameTime);
  const strongestEnemy = strongestVisiblePlayer(snapshot.enemies, snapshot.gameTime);
  const allyTarget = strongestAlly ? priorityTarget(strongestAlly, snapshot.activePlayer, snapshot.gameTime) : null;
  const enemyTarget = strongestEnemy ? priorityTarget(strongestEnemy, snapshot.activePlayer, snapshot.gameTime) : null;
  const allyTags = strongestAlly ? getChampionTags(strongestAlly.championName) : [];
  const enemyTags = strongestEnemy ? getChampionTags(strongestEnemy.championName) : [];

  const allyAction = !allyTarget
    ? null
    : allyTarget.isActivePlayer
      ? "Eres la pieza más fuerte visible: protege tu recompensa y convierte la ventaja con visión y objetivos."
      : allyTags.includes("engage")
        ? `Juega cerca de ${allyTarget.championName} para acompañar su iniciación y convertirla en objetivo.`
        : allyTags.includes("peel")
          ? `Mantén a ${allyTarget.championName} protegido: su utilidad permite que el equipo juegue peleas largas.`
          : `Prioriza recursos, visión y cobertura alrededor de ${allyTarget.championName}, la ventaja visible de tu equipo.`;

  const enemyAction = !enemyTarget
    ? null
    : enemyTags.includes("dive") || enemyTags.includes("burst")
      ? `Respeta el flanco de ${enemyTarget.championName}: usa control y visión antes de exponer al carry.`
      : enemyTags.includes("frontline") || enemyTags.includes("sustain")
        ? `No gastes todo sobre ${enemyTarget.championName} sin control y seguimiento; corta su acceso al backline.`
        : `Marca a ${enemyTarget.championName} como amenaza prioritaria: evita que juegue una pelea libre.`;

  const buildAdjustment = !enemyTarget
    ? null
    : enemyTags.includes("ap") && !enemyTags.includes("ad")
      ? `Considera resistencia mágica antes del siguiente objeto codicioso contra ${enemyTarget.championName}.`
      : enemyTags.includes("ad") && !enemyTags.includes("ap")
        ? `Considera armadura o vida antes del siguiente objeto codicioso contra ${enemyTarget.championName}.`
        : `Ajusta el siguiente objeto por el tipo de daño y control que aporta ${enemyTarget.championName}.`;

  return { strongestAlly: allyTarget, strongestEnemy: enemyTarget, allyAction, enemyAction, buildAdjustment };
}

export function scoreLaneState(
  player: LivePlayerSnapshot,
  opponent: LivePlayerSnapshot,
  gameTime: number | null,
) {
  const minutes = Math.max((gameTime ?? 0) / 60, 3);
  const levelDelta = player.level - opponent.level;
  const farmDelta = player.scores.creepScore - opponent.scores.creepScore;
  const combatDelta = getCombatValue(player) - getCombatValue(opponent);
  const inventoryDelta = player.visibleInventoryGold !== null && opponent.visibleInventoryGold !== null
    ? player.visibleInventoryGold - opponent.visibleInventoryGold
    : null;

  const factors: LiveCoachFactor[] = [
    {
      id: "level",
      points: clamp(levelDelta * 18, -36, 36),
      label: factorLabel("Nivel", levelDelta),
    },
    {
      id: "farm",
      points: clamp((farmDelta / minutes) * 12, -24, 24),
      label: factorLabel("CS", farmDelta),
    },
    {
      id: "combat",
      points: clamp(combatDelta * 7, -24, 24),
      label: factorLabel("Impacto KDA", Math.round(combatDelta * 10) / 10),
    },
  ];

  if (inventoryDelta !== null) {
    factors.push({
      id: "inventory",
      points: clamp((inventoryDelta / 1000) * 30, -30, 30),
      label: factorLabel("Inventario visible", inventoryDelta, " oro"),
    });
  }

  return {
    score: Math.round(clamp(factors.reduce((total, factor) => total + factor.points, 0), -100, 100)),
    factors,
  };
}

function phaseCopy(phase: GamePhase) {
  return phase === "opening" ? "apertura"
    : phase === "laning" ? "fase de líneas"
      : phase === "transition" ? "transición"
        : "macro";
}

function planFor(advantage: LaneAdvantage, phase: GamePhase, opponentName: string | null) {
  const rival = opponentName ?? "tu rival";
  const macro = phase === "transition" || phase === "macro";

  if (advantage === "unknown") {
    return {
      title: macro ? "Plan seguro de mapa" : "Plan seguro de línea",
      summary: "Aún no hay suficientes datos para comparar tu estado con el rival directo.",
      actions: macro
        ? ["Juega alrededor del próximo objetivo visible.", "Mantén una ruta segura de recursos antes de agruparte."]
        : ["Prioriza experiencia y súbditos seguros.", "Evita comprometer recursos sin conocer la posición rival."],
      avoid: "No conviertas una lectura incompleta en una jugada forzada.",
    };
  }

  if (advantage === "dominant") {
    return {
      title: macro ? "Convierte tu ventaja" : "Presiona con control",
      summary: `Tienes una ventaja clara sobre ${rival}; úsala para ampliar el mapa, no solo para buscar otra baja.`,
      actions: macro
        ? ["Empuja una línea antes de moverte al objetivo.", "Fuerza presión donde puedas salir sin entregar tu recompensa."]
        : ["Niega súbditos y prepara el reinicio antes de abandonar la línea.", "Extiende la presión solo con visión del lado vulnerable."],
      avoid: "No regales la recompensa persiguiendo una jugada de baja probabilidad.",
    };
  }

  if (advantage === "ahead") {
    return {
      title: macro ? "Amplía la ventaja" : "Juega agresivo con ventanas",
      summary: `Vas por delante de ${rival}, pero la ventaja todavía se puede perder con un mal intercambio.`,
      actions: macro
        ? ["Convierte la prioridad en visión u objetivo.", "Completa tu siguiente pico de objeto antes de forzar."]
        : ["Busca intercambios cuando tengas nivel u objeto a favor.", "Empuja antes de rotar para no perder recursos gratis."],
      avoid: "No mantengas presión sin visión ni con una compra importante pendiente.",
    };
  }

  if (advantage === "even") {
    return {
      title: macro ? "Juega por el próximo pico" : "Línea estable",
      summary: `La diferencia con ${rival} no justifica forzar; decide por oleada, enfriamientos y próxima compra.`,
      actions: macro
        ? ["Recoge recursos seguros antes del próximo objetivo.", "Agrúpate cuando tu función en composición aporte más que la presión lateral."]
        : ["Prioriza CS y castiga errores claros, no intercambios neutros.", "Reinicia cuando puedas convertir el oro en un pico real."],
      avoid: "No confundas una línea igualada con la obligación de crear ventaja inmediatamente.",
    };
  }

  if (advantage === "behind") {
    return {
      title: macro ? "Recupera recursos sin aislarte" : "Estabiliza la línea",
      summary: `${rival} tiene una ventaja moderada. Reduce la exposición y conserva acceso a experiencia y oro.`,
      actions: macro
        ? ["Recoge la oleada más segura y llega con tiempo al objetivo.", "Aporta utilidad al equipo en lugar de buscar un duelo directo."]
        : ["Cede súbditos peligrosos antes que vida o una muerte.", "Mantén la oleada cerca de una zona segura cuando sea posible."],
      avoid: "No intentes recuperar toda la diferencia en un único intercambio.",
    };
  }

  return {
    title: macro ? "Juega para volver a entrar" : "Defiende recursos clave",
    summary: `${rival} tiene una ventaja grande. Tu prioridad es cortar pérdidas y seguir siendo útil.`,
    actions: macro
      ? ["Evita líneas largas sin visión y comparte presión con el equipo.", "Construye hacia utilidad o supervivencia antes que daño codicioso."]
      : ["Acepta la pérdida de presión y protege experiencia bajo una zona segura.", "Pide cobertura solo para romper una congelación o asegurar el reinicio."],
    avoid: "No disputes el duelo en igualdad de condiciones mientras siga la desventaja.",
  };
}

export function analyzeInGameState(
  snapshot: LiveGameSnapshot,
  previousAnalysis?: InGameCoachAnalysis | null,
): InGameCoachAnalysis | null {
  if (snapshot.status !== "in-game") return null;

  const phase = getGamePhase(snapshot.gameTime);
  const player = snapshot.activePlayer;
  const opponent = snapshot.laneOpponent;
  if (!player || !opponent) {
    const plan = planFor("unknown", phase, null);
    return {
      phase,
      advantage: "unknown",
      posture: "controlled",
      score: 0,
      confidence: "low",
      opponentName: null,
      factors: [],
      matchup: { source: "unknown", label: "Rival de línea sin confirmar", summary: "El plan no asume un matchup hasta que League publique posiciones compatibles." },
      teamPriorities: getTeamPriorities(snapshot),
      ...plan,
    };
  }

  const { score, factors } = scoreLaneState(player, opponent, snapshot.gameTime);
  const sameContext = previousAnalysis?.opponentName === opponent.championName
    && previousAnalysis.phase === phase;
  const advantage = getAdvantage(score, sameContext ? previousAnalysis.advantage : undefined);
  const hasConfirmedRoles = player.roleSource === "live-client" && opponent.roleSource === "live-client";
  const hasReliableInventory = player.inventoryGoldSource === "data-dragon"
    && opponent.inventoryGoldSource === "data-dragon";
  const confidence = hasReliableInventory && hasConfirmedRoles ? "high" : "medium";
  const plan = planFor(advantage, phase, opponent.championName);
  const matchup = getLaneMatchupAdvice(player.championName, opponent.championName, advantage);
  const actions = matchup.action ? [matchup.action, ...plan.actions].slice(0, 2) : plan.actions;

  return {
    phase,
    advantage,
    posture: getPosture(advantage),
    score,
    confidence,
    opponentName: opponent.championName,
    factors,
    summary: `${plan.summary} ${matchup.summary} Lectura de ${phaseCopy(phase)} basada en datos visibles.`,
    title: plan.title,
    actions,
    avoid: matchup.avoid ?? plan.avoid,
    matchup: { source: matchup.source, label: matchup.label, summary: matchup.summary },
    teamPriorities: getTeamPriorities(snapshot),
  };
}
