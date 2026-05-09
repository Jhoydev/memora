import { StudyService } from "./study.service";

describe("StudyService", () => {
  const service = new StudyService();

  it("creates an empty session state", () => {
    const session = service.startSession("topic-1", [
      {
        id: "card-1",
        topicId: "topic-1",
        front: "Hola",
        back: "Hello",
        createdAt: "2025-01-01",
        updatedAt: "2025-01-01",
      },
    ]);

    expect(session).toEqual({
      topicId: "topic-1",
      totalCards: 1,
      answers: {},
    });
  });

  it("builds the final summary from answers", () => {
    const result = service.finishSession(
      "topic-1",
      {
        "card-1": "known",
        "card-2": "unknown",
      },
      2,
    );

    expect(result).toEqual({
      topicId: "topic-1",
      totalCards: 2,
      knownCards: 1,
      unknownCards: 1,
    });
  });
});
