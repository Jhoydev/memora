import { APP_ERROR_CODES, AppError } from "@/lib/errors/app-error";
import type { TopicRepository } from "@/features/topics/repositories/topic.repository";
import type { FlashcardRepository } from "../repositories/flashcard.repository";
import { FlashcardService } from "./flashcard.service";

function createFlashcardRepositoryMock(): FlashcardRepository {
  return {
    findByTopicId: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(async (input) => ({
      id: "flashcard-1",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
      ...input,
    })),
    update: vi.fn(async (id, input) => ({
      id,
      topicId: "topic-1",
      front: "Pregunta",
      back: "Respuesta",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-02",
      ...input,
    })),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteByTopicId: vi.fn().mockResolvedValue(undefined),
  };
}

function createTopicRepositoryMock(): TopicRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue({
      id: "topic-1",
      name: "Tema",
      color: "#0ea5e9",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe("FlashcardService", () => {
  it("creates a flashcard when the topic exists", async () => {
    const flashcardRepository = createFlashcardRepositoryMock();
    const service = new FlashcardService(flashcardRepository, createTopicRepositoryMock());

    const flashcard = await service.createFlashcard({
      topicId: "topic-1",
      front: "Pregunta",
      back: "Respuesta",
    });

    expect(flashcard.topicId).toBe("topic-1");
    expect(flashcardRepository.create).toHaveBeenCalled();
  });

  it("throws when creating a flashcard for a missing topic", async () => {
    const flashcardRepository = createFlashcardRepositoryMock();
    const topicRepository = createTopicRepositoryMock();
    vi.mocked(topicRepository.findById).mockResolvedValueOnce(null);
    const service = new FlashcardService(flashcardRepository, topicRepository);

    await expect(
      service.createFlashcard({
        topicId: "missing-topic",
        front: "Pregunta",
        back: "Respuesta",
      }),
    ).rejects.toMatchObject<AppError>({
      code: APP_ERROR_CODES.TOPIC_NOT_FOUND,
    });
  });

  it("throws validation error when updating with empty input", async () => {
    const service = new FlashcardService(
      createFlashcardRepositoryMock(),
      createTopicRepositoryMock(),
    );

    await expect(service.updateFlashcard("flashcard-1", {})).rejects.toMatchObject<AppError>({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
    });
  });
});
