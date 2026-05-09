import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateTopicInput } from "../domain/topic.schema";
import { topicService } from "../services/topic-service.factory";
import { topicQueryKeys } from "./topic.query-keys";

export function useCreateTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTopicInput) => topicService.createTopic(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: topicQueryKeys.lists(),
      });
    },
  });
}
