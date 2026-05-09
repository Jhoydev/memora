import { useMutation, useQueryClient } from "@tanstack/react-query";
import { flashcardQueryKeys } from "@/features/flashcards/queries/flashcard.query-keys";
import { topicService } from "../services/topic-service.factory";
import { topicQueryKeys } from "./topic.query-keys";

export function useDeleteTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (topicId: string) => topicService.deleteTopic(topicId),
    onSuccess: (_, topicId) => {
      queryClient.invalidateQueries({
        queryKey: topicQueryKeys.lists(),
      });

      queryClient.removeQueries({
        queryKey: topicQueryKeys.detail(topicId),
      });

      queryClient.removeQueries({
        queryKey: flashcardQueryKeys.byTopic(topicId),
      });
    },
  });
}
