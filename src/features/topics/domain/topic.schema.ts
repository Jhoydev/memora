import { z } from "zod";

export const createTopicSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  color: z.string().min(1, "El color es obligatorio"),
  icon: z.string().optional(),
});

export const updateTopicSchema = createTopicSchema.partial();

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
