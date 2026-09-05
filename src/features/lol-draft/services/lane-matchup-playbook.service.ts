import type { LaneAdvantage } from "../domain/in-game-coach.types";
import { CHAMPIONS } from "./lol-draft-data";

export type LaneMatchupAdvice = {
  source: "specific" | "archetype" | "unknown";
  label: string;
  summary: string;
  action: string | null;
  avoid: string | null;
};

type MatchupRule = {
  label: string;
  summary: string;
  controlled: string;
  ahead: string;
  behind: string;
  avoid: string;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

const OPPONENT_RULES: Record<string, MatchupRule> = {
  darius: {
    label: "Matchup específico · Darius",
    summary: "Amenaza de intercambio largo y presión de ejecución. La prioridad es cortar el trade antes de que acumule ventaja sostenida.",
    controlled: "Haz intercambios cortos y retrocede antes de que Darius pueda alargar la pelea con sus acumulaciones.",
    ahead: "Con ventaja, fuerza oleadas cortas y castiga su acercamiento; no conviertas la presión en un duelo largo sin recursos.",
    behind: "Mantén vida para la experiencia y evita entrar en su rango de intercambio extendido sin una oleada favorable.",
    avoid: "No persigas a Darius por una baja: su amenaza aumenta cuanto más tiempo dura el intercambio.",
  },
  aurora: {
    label: "Matchup específico · Aurora",
    summary: "Amenaza mágica móvil de poke y burst. La prioridad es conservar vida y no regalar una entrada limpia a su daño.",
    controlled: "Muévete lateralmente al farmear y conserva tu herramienta de movilidad o escape para su ventana de burst.",
    ahead: "Empuja con control y acércate solo cuando Aurora haya usado recursos para limpiar o pokear la oleada.",
    behind: "Prioriza resistencia mágica y súbditos seguros; no cruces la línea de la oleada para responder a cada poke.",
    avoid: "No gastes tu herramienta de salida antes de conocer la posición del jungla o la ventana de daño de Aurora.",
  },
  gnar: {
    label: "Matchup específico · Gnar",
    summary: "Alterna presión a distancia y un pico de control cuerpo a cuerpo. La prioridad cambia con su transformación.",
    controlled: "Respeta el rango cuando está pequeño y evita el all-in cuando está a punto de transformarse.",
    ahead: "Castiga su forma pequeña con presión corta antes de que pueda convertir la oleada en una entrada de Mega Gnar.",
    behind: "Cede espacio durante su transformación y recoge la oleada cuando su control ya no amenace una entrada directa.",
    avoid: "No tomes un intercambio largo cerca de paredes cuando Gnar puede convertirlo en control encadenado.",
  },
  camille: {
    label: "Matchup específico · Camille",
    summary: "Amenaza de flanco y trade explosivo si encuentra una entrada limpia. La prioridad es negar su acceso lateral.",
    controlled: "Mantén la oleada lejos de paredes favorables y guarda control o movilidad para cortar su entrada.",
    ahead: "Presiona la oleada para limitar sus ángulos de flanco y castiga cuando use movilidad sin poder completar el intercambio.",
    behind: "No contestes solo una línea larga sin visión; Camille convierte muy bien los errores de posición en all-in.",
    avoid: "No gastes tu habilidad defensiva antes de que Camille muestre su entrada.",
  },
};

const PAIR_OVERRIDES: Record<string, Partial<MatchupRule>> = {
  "malphite:darius": {
    controlled: "Usa el poke para castigar el último golpe y corta el intercambio antes de que Darius pueda prolongarlo.",
    ahead: "Con armadura y vida a favor, desgasta antes de comprometer tu iniciación; no regales un duelo extendido.",
  },
  "camille:darius": {
    controlled: "Reserva tu entrada para después de que Darius comprometa recursos; busca trade corto y salida inmediata.",
    behind: "No uses la movilidad hacia delante sin oleada y visión: prioriza experiencia, vida y una salida segura.",
  },
  "malphite:aurora": {
    controlled: "Conserva vida frente al poke y usa tu alcance solo cuando Aurora se acerque a la oleada.",
    behind: "Empieza defensivo contra daño mágico y evita intercambios donde Aurora pueda reposicionarse gratis.",
  },
};

function actionFor(rule: MatchupRule, advantage: LaneAdvantage) {
  if (advantage === "dominant" || advantage === "ahead") return rule.ahead;
  if (advantage === "behind" || advantage === "critical") return rule.behind;
  return rule.controlled;
}

function getArchetypeRule(opponentName: string): MatchupRule | null {
  const opponent = CHAMPIONS.find((champion) => normalize(champion.name) === normalize(opponentName));
  if (!opponent) return null;

  if (opponent.tags.includes("poke") || opponent.tags.includes("burst")) {
    return {
      label: "Arquetipo · poke/burst",
      summary: "Rival de rango o daño explosivo: la vida y la posición son recursos de línea.",
      controlled: "Farmea con movimientos cortos y responde solo cuando el rival use recursos sobre la oleada.",
      ahead: "Presiona la oleada antes de acercarte; fuerza intercambios cuando el rival no pueda responder desde rango.",
      behind: "Reduce exposición, conserva vida y compra para resistir el tipo de daño dominante.",
      avoid: "No intercambies vida de forma repetida sin una ventana concreta de respuesta.",
    };
  }
  if (opponent.tags.includes("sustain") || opponent.tags.includes("frontline")) {
    return {
      label: "Arquetipo · duelo sostenido",
      summary: "Rival resistente que gana valor si el intercambio se alarga.",
      controlled: "Busca daño corto y no regales una pelea completa sin ventaja de oleada o recursos.",
      ahead: "Niega oleada y fuerza intercambios breves antes de que el rival pueda sostenerse.",
      behind: "No discutas peleas largas; conserva experiencia y espera tu compra defensiva.",
      avoid: "No conviertas un intercambio parejo en una pelea extendida por orgullo.",
    };
  }
  return null;
}

/** Shared matchup guidance for draft hypotheses and confirmed in-game lanes. */
export function getLaneMatchupAdvice(playerName: string, opponentName: string, advantage: LaneAdvantage = "even"): LaneMatchupAdvice {
  const opponentId = normalize(opponentName);
  const opponentRule = OPPONENT_RULES[opponentId];
  const pairRule = PAIR_OVERRIDES[`${normalize(playerName)}:${opponentId}`];
  if (opponentRule) {
    const rule = { ...opponentRule, ...pairRule };
    return { source: "specific", label: rule.label, summary: rule.summary, action: actionFor(rule, advantage), avoid: rule.avoid };
  }

  const archetype = getArchetypeRule(opponentName);
  if (archetype) return { source: "archetype", label: archetype.label, summary: archetype.summary, action: actionFor(archetype, advantage), avoid: archetype.avoid };

  return { source: "unknown", label: "Matchup por completar", summary: "Aún no hay una ficha táctica específica para este rival.", action: null, avoid: null };
}
