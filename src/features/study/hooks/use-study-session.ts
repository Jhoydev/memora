"use client";

import { useMemo, useState } from "react";
import type { Flashcard } from "@/features/flashcards/domain/flashcard.types";
import type { StudyAnswerResult } from "../domain/study.types";
import { StudyService } from "../services/study.service";

type UseStudySessionParams = {
  topicId: string;
  flashcards: Flashcard[];
};

const studyService = new StudyService();

export function useStudySession({ topicId, flashcards }: UseStudySessionParams) {
  const [currentIndex, setCurrentIndex] = useState(() => 0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(() => false);
  const [answers, setAnswers] = useState<Record<string, StudyAnswerResult>>(() => {
    const session = studyService.startSession(topicId, flashcards);
    return session.answers;
  });
  const [isCompleted, setIsCompleted] = useState(() => false);

  const currentFlashcard = flashcards[currentIndex] ?? null;
  const totalCards = flashcards.length;
  const answeredCount = Object.keys(answers).length;

  const result = useMemo(
    () => studyService.finishSession(topicId, answers, totalCards),
    [answers, topicId, totalCards],
  );

  const progressPercent = totalCards === 0 ? 0 : (answeredCount / totalCards) * 100;

  function revealAnswer() {
    setIsAnswerVisible(true);
  }

  function answerCurrentCard(resultValue: StudyAnswerResult) {
    if (!currentFlashcard) {
      return;
    }

    const nextAnswers = studyService.answerCard(answers, currentFlashcard.id, resultValue);
    setAnswers(nextAnswers);

    const isLastCard = currentIndex >= totalCards - 1;

    if (isLastCard) {
      setIsCompleted(true);
      setIsAnswerVisible(false);
      return;
    }

    setCurrentIndex((value) => value + 1);
    setIsAnswerVisible(false);
  }

  function restartSession() {
    const session = studyService.startSession(topicId, flashcards);
    setCurrentIndex(0);
    setIsAnswerVisible(false);
    setAnswers(session.answers);
    setIsCompleted(false);
  }

  return {
    answeredCount,
    answerCurrentCard,
    currentFlashcard,
    currentIndex,
    isAnswerVisible,
    isCompleted,
    progressPercent,
    restartSession,
    result,
    revealAnswer,
    totalCards,
  };
}
