export type StudyAnswerResult = "known" | "unknown";

export type StudySessionResult = {
  topicId: string;
  totalCards: number;
  knownCards: number;
  unknownCards: number;
};
