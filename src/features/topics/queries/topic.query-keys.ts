export const topicQueryKeys = {
  all: ["topics"] as const,
  lists: () => [...topicQueryKeys.all, "list"] as const,
  detail: (topicId: string) => [...topicQueryKeys.all, "detail", topicId] as const,
};
