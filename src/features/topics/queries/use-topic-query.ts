import { useQuery } from "@tanstack/react-query";
import { topicService } from "../services/topic-service.factory";
import { topicQueryKeys } from "./topic.query-keys";

export function useTopicQuery(topicId: string) {
  return useQuery({
    queryKey: topicQueryKeys.detail(topicId),
    queryFn: () => topicService.getTopicById(topicId),
    enabled: Boolean(topicId),
  });
}
