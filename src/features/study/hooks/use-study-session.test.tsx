import { renderHook, act } from "@testing-library/react";
import { useStudySession } from "./use-study-session";

const flashcards = [
  {
    id: "card-1",
    topicId: "topic-1",
    front: "Uno",
    back: "One",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
  {
    id: "card-2",
    topicId: "topic-1",
    front: "Dos",
    back: "Two",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
];

describe("useStudySession", () => {
  it("reveals, answers and completes the session", () => {
    const { result } = renderHook(() =>
      useStudySession({
        topicId: "topic-1",
        flashcards,
      }),
    );

    act(() => {
      result.current.revealAnswer();
    });

    expect(result.current.isAnswerVisible).toBe(true);

    act(() => {
      result.current.answerCurrentCard("known");
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.answeredCount).toBe(1);

    act(() => {
      result.current.revealAnswer();
      result.current.answerCurrentCard("unknown");
    });

    expect(result.current.isCompleted).toBe(true);
    expect(result.current.result.knownCards).toBe(1);
    expect(result.current.result.unknownCards).toBe(1);
  });
});
