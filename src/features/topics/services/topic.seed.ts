import type { CreateFlashcardInput } from "@/features/flashcards/domain/flashcard.schema";
import type { CreateTopicInput } from "../domain/topic.schema";

type InitialFlashcardSeed = Omit<CreateFlashcardInput, "topicId">;

type InitialTopicSeedEntry = {
  topic: CreateTopicInput;
  flashcards: InitialFlashcardSeed[];
};

export const initialTopicSeed: InitialTopicSeedEntry[] = [
  {
    topic: {
      name: "Vocabulario",
      color: "#0ea5e9",
      icon: "languages",
    },
    flashcards: [
      {
        front: "abundant",
        back: "abundante",
      },
      {
        front: "to achieve",
        back: "lograr, alcanzar una meta",
      },
      {
        front: "careful",
        back: "cuidadoso, atento al detalle",
      },
    ],
  },
  {
    topic: {
      name: "Historia",
      color: "#f97316",
      icon: "landmark",
    },
    flashcards: [
      {
        front: "¿En qué año cayó Constantinopla?",
        back: "En 1453, marcando el final del Imperio bizantino.",
      },
      {
        front: "¿Qué revolución comenzó en 1789?",
        back: "La Revolución francesa.",
      },
      {
        front: "¿Quién lideró la independencia de gran parte de Sudamérica?",
        back: "Simón Bolívar fue una de las figuras centrales.",
      },
    ],
  },
  {
    topic: {
      name: "Ciencia",
      color: "#22c55e",
      icon: "flask-conical",
    },
    flashcards: [
      {
        front: "¿Qué organelo produce energía en la célula?",
        back: "La mitocondria.",
      },
      {
        front: "¿Qué fuerza mantiene a los planetas en órbita?",
        back: "La gravedad.",
      },
      {
        front: "¿Cuál es la fórmula química del agua?",
        back: "H2O.",
      },
    ],
  },
  {
    topic: {
      name: "Creatividad",
      color: "#ec4899",
      icon: "pencil-ruler",
    },
    flashcards: [
      {
        front: "¿Qué es un moodboard?",
        back: "Una composición visual de referencias para definir tono, estilo y dirección creativa.",
      },
      {
        front: "¿Qué busca una paleta complementaria?",
        back: "Contraste visual usando colores opuestos en el círculo cromático.",
      },
      {
        front: "¿Para qué sirve una retícula en diseño?",
        back: "Para ordenar contenido, alinear elementos y crear coherencia visual.",
      },
    ],
  },
  {
    topic: {
      name: "Memoria",
      color: "#8b5cf6",
      icon: "brain",
    },
    flashcards: [
      {
        front: "¿Qué es la repetición espaciada?",
        back: "Una técnica que distribuye repasos en el tiempo para mejorar la retención.",
      },
      {
        front: "¿Qué significa recuperación activa?",
        back: "Intentar recordar información sin verla antes, en lugar de solo releer.",
      },
      {
        front: "¿Qué mejora un buen mnemónico?",
        back: "La asociación y el recuerdo rápido de información compleja.",
      },
    ],
  },
];
