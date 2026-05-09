import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateTopicInput } from "../domain/topic.schema";
import { topicService } from "../services/topic-service.factory";
import { topicQueryKeys } from "./topic.query-keys";

type UpdateTopicMutationInput = {
  topicId: string;
  input: UpdateTopicInput;
};

export function useUpdateTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, input }: UpdateTopicMutationInput) =>
      topicService.updateTopic(topicId, input),
    onSuccess: (topic) => {
      queryClient.invalidateQueries({
        queryKey: topicQueryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: topicQueryKeys.detail(topic.id),
      });
    },
  });
}
