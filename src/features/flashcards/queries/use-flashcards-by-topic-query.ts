import { useQuery } from "@tanstack/react-query";
import { flashcardService } from "../services/flashcard-service.factory";
import { flashcardQueryKeys } from "./flashcard.query-keys";

export function useFlashcardsByTopicQuery(topicId: string) {
  return useQuery({
    queryKey: flashcardQueryKeys.byTopic(topicId),
    queryFn: () => flashcardService.getFlashcardsByTopic(topicId),
    enabled: Boolean(topicId),
  });
}
