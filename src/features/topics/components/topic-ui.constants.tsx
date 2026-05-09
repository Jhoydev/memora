import type { ComponentType } from "react";
import {
  BookMarked,
  Brain,
  FlaskConical,
  Landmark,
  Languages,
  PencilRuler,
} from "lucide-react";

export type TopicColorOption = {
  label: string;
  value: string;
  chipClassName: string;
};

export type TopicIconId =
  | "book-marked"
  | "brain"
  | "flask-conical"
  | "landmark"
  | "languages"
  | "pencil-ruler";

export const topicColorOptions: TopicColorOption[] = [
  {
    label: "Azul estudio",
    value: "#0ea5e9",
    chipClassName: "bg-sky-500",
  },
  {
    label: "Naranja impulso",
    value: "#f97316",
    chipClassName: "bg-orange-500",
  },
  {
    label: "Verde ciencia",
    value: "#22c55e",
    chipClassName: "bg-emerald-500",
  },
  {
    label: "Rosa memoria",
    value: "#ec4899",
    chipClassName: "bg-pink-500",
  },
  {
    label: "Violeta foco",
    value: "#8b5cf6",
    chipClassName: "bg-violet-500",
  },
  {
    label: "Amarillo energia",
    value: "#f59e0b",
    chipClassName: "bg-amber-500",
  },
];

export const topicIconOptions: Array<{ label: string; value: TopicIconId; icon: ComponentType<{ className?: string }> }> =
  [
    { label: "Idiomas", value: "languages", icon: Languages },
    { label: "Historia", value: "landmark", icon: Landmark },
    { label: "Ciencia", value: "flask-conical", icon: FlaskConical },
    { label: "Creatividad", value: "pencil-ruler", icon: PencilRuler },
    { label: "Lectura", value: "book-marked", icon: BookMarked },
    { label: "Memoria", value: "brain", icon: Brain },
  ];

export const topicIconMap: Record<TopicIconId, ComponentType<{ className?: string }>> = {
  "book-marked": BookMarked,
  brain: Brain,
  "flask-conical": FlaskConical,
  landmark: Landmark,
  languages: Languages,
  "pencil-ruler": PencilRuler,
};

export function getTopicColorMeta(color: string) {
  return topicColorOptions.find((option) => option.value === color) ?? topicColorOptions[0];
}
