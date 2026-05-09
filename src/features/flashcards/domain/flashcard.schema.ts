import { z } from "zod";

export const createFlashcardSchema = z.object({
  topicId: z.string().min(1),
  front: z.string().min(1, "La pregunta es obligatoria"),
  back: z.string().min(1, "La respuesta es obligatoria"),
});

export const updateFlashcardSchema = createFlashcardSchema
  .omit({ topicId: true })
  .partial();

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
