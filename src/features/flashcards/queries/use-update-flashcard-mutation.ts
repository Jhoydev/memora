import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateFlashcardInput } from "../domain/flashcard.schema";
import { flashcardService } from "../services/flashcard-service.factory";
import { flashcardQueryKeys } from "./flashcard.query-keys";

type UpdateFlashcardMutationInput = {
  flashcardId: string;
  topicId: string;
  input: UpdateFlashcardInput;
};

export function useUpdateFlashcardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flashcardId, input }: UpdateFlashcardMutationInput) =>
      flashcardService.updateFlashcard(flashcardId, input),
    onSuccess: (flashcard) => {
      queryClient.invalidateQueries({
        queryKey: flashcardQueryKeys.byTopic(flashcard.topicId),
      });

      queryClient.invalidateQueries({
        queryKey: flashcardQueryKeys.detail(flashcard.id),
      });
    },
  });
}
