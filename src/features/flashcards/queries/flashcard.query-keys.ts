export const flashcardQueryKeys = {
  all: ["flashcards"] as const,
  byTopic: (topicId: string) => [...flashcardQueryKeys.all, "by-topic", topicId] as const,
  detail: (flashcardId: string) =>
    [...flashcardQueryKeys.all, "detail", flashcardId] as const,
};
