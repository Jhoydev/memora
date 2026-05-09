import type { Flashcard } from "@/features/flashcards/domain/flashcard.types";
import type { StudyAnswerResult, StudySessionResult } from "../domain/study.types";

export class StudyService {
  startSession(topicId: string, flashcards: Flashcard[]) {
    return {
      topicId,
      totalCards: flashcards.length,
      answers: {} as Record<string, StudyAnswerResult>,
    };
  }

  answerCard(
    answers: Record<string, StudyAnswerResult>,
    cardId: string,
    result: StudyAnswerResult,
  ) {
    return {
      ...answers,
      [cardId]: result,
    };
  }

  finishSession(
    topicId: string,
    answers: Record<string, StudyAnswerResult>,
    totalCards: number,
  ): StudySessionResult {
    const knownCards = Object.values(answers).filter((value) => value === "known").length;
    const unknownCards = Object.values(answers).filter((value) => value === "unknown").length;

    return {
      topicId,
      totalCards,
      knownCards,
      unknownCards,
    };
  }
}
