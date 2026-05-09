import { APP_ERROR_CODES, AppError } from "@/lib/errors/app-error";
import type { FlashcardRepository } from "@/features/flashcards/repositories/flashcard.repository";
import type { TopicRepository } from "../repositories/topic.repository";
import { TopicService } from "./topic.service";

function createTopicRepositoryMock(): TopicRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(async (input) => ({
      id: "topic-1",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
      ...input,
    })),
    update: vi.fn(async (id, input) => ({
      id,
      name: "Tema",
      color: "#0ea5e9",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-02",
      ...input,
    })),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function createFlashcardRepositoryMock(): FlashcardRepository {
  return {
    findByTopicId: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(async (input) => ({
      id: crypto.randomUUID(),
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
      ...input,
    })),
    update: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteByTopicId: vi.fn().mockResolvedValue(undefined),
  };
}

describe("TopicService", () => {
  it("seeds 5 topics and 15 flashcards on first real load", async () => {
    const repository = createTopicRepositoryMock();
    const flashcardRepository = createFlashcardRepositoryMock();
    const service = new TopicService(repository, flashcardRepository, {
      hasKey: vi.fn().mockReturnValue(false),
    } as never);

    const topics = await service.getTopics();

    expect(topics).toHaveLength(5);
    expect(repository.create).toHaveBeenCalledTimes(5);
    expect(flashcardRepository.create).toHaveBeenCalledTimes(15);
  });

  it("throws validation error when updating with empty input", async () => {
    const repository = createTopicRepositoryMock();
    const service = new TopicService(repository);

    await expect(service.updateTopic("topic-1", {})).rejects.toMatchObject<AppError>({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
    });
  });

  it("throws not found when deleting an unknown topic", async () => {
    const repository = createTopicRepositoryMock();
    const service = new TopicService(repository);

    await expect(service.deleteTopic("missing")).rejects.toMatchObject<AppError>({
      code: APP_ERROR_CODES.TOPIC_NOT_FOUND,
    });
  });
});
