import { useMutation, useQueryClient } from "@tanstack/react-query";
import { flashcardService } from "../services/flashcard-service.factory";
import { flashcardQueryKeys } from "./flashcard.query-keys";

type DeleteFlashcardMutationInput = {
  flashcardId: string;
  topicId: string;
};

export function useDeleteFlashcardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flashcardId }: DeleteFlashcardMutationInput) =>
      flashcardService.deleteFlashcard(flashcardId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: flashcardQueryKeys.byTopic(variables.topicId),
      });

      queryClient.removeQueries({
        queryKey: flashcardQueryKeys.detail(variables.flashcardId),
      });
    },
  });
}
