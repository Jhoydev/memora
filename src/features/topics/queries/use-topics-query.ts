import { useQuery } from "@tanstack/react-query";
import { topicService } from "../services/topic-service.factory";
import { topicQueryKeys } from "./topic.query-keys";

export function useTopicsQuery() {
  return useQuery({
    queryKey: topicQueryKeys.lists(),
    queryFn: () => topicService.getTopics(),
  });
}
