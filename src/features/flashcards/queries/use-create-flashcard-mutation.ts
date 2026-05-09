import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateFlashcardInput } from "../domain/flashcard.schema";
import { flashcardService } from "../services/flashcard-service.factory";
import { flashcardQueryKeys } from "./flashcard.query-keys";

export function useCreateFlashcardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFlashcardInput) => flashcardService.createFlashcard(input),
    onSuccess: (flashcard) => {
      queryClient.invalidateQueries({
        queryKey: flashcardQueryKeys.byTopic(flashcard.topicId),
      });
    },
  });
}
