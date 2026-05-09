import type { CreateTopicInput } from "../domain/topic.schema";

export const initialTopicSeed: CreateTopicInput[] = [
  {
    name: "Vocabulario",
    color: "#0ea5e9",
    icon: "languages",
  },
  {
    name: "Historia",
    color: "#f97316",
    icon: "landmark",
  },
  {
    name: "Ciencia",
    color: "#22c55e",
    icon: "flask-conical",
  },
];
