import type { FlashcardRepository } from "@/features/flashcards/repositories/flashcard.repository";
import { LocalStorageClient } from "@/lib/storage/local-storage.client";
import { STORAGE_KEYS } from "@/lib/storage/storage-keys";
import { AppError, APP_ERROR_CODES } from "@/lib/errors/app-error";
import { createTopicSchema, updateTopicSchema } from "../domain/topic.schema";
import type { CreateTopicInput, UpdateTopicInput } from "../domain/topic.schema";
import type { StudyTopic } from "../domain/topic.types";
import type { TopicRepository } from "../repositories/topic.repository";
import { initialTopicSeed } from "./topic.seed";

export class TopicService {
  constructor(
    private readonly topicRepository: TopicRepository,
    private readonly flashcardRepository?: FlashcardRepository,
    private readonly storageClient = new LocalStorageClient(),
  ) {}

  async getTopics(): Promise<StudyTopic[]> {
    const hasTopicsStorage = this.storageClient.hasKey(STORAGE_KEYS.TOPICS);
    const hasFlashcardsStorage = this.storageClient.hasKey(STORAGE_KEYS.FLASHCARDS);
    const topics = await this.topicRepository.findAll();

    if (hasTopicsStorage || topics.length > 0) {
      return topics;
    }

    const seededTopics: StudyTopic[] = [];

    for (const seedEntry of initialTopicSeed) {
      const topic = await this.topicRepository.create(seedEntry.topic);
      seededTopics.push(topic);

      if (this.flashcardRepository && !hasFlashcardsStorage) {
        for (const flashcard of seedEntry.flashcards) {
          await this.flashcardRepository.create({
            topicId: topic.id,
            front: flashcard.front,
            back: flashcard.back,
          });
        }
      }
    }

    return seededTopics;
  }

  async getTopicById(id: string): Promise<StudyTopic | null> {
    return this.topicRepository.findById(id);
  }

  async createTopic(input: CreateTopicInput): Promise<StudyTopic> {
    const parsedInput = createTopicSchema.safeParse(input);

    if (!parsedInput.success) {
      throw new AppError("Los datos del tema no son validos.", APP_ERROR_CODES.VALIDATION_ERROR);
    }

    return this.topicRepository.create(parsedInput.data);
  }

  async updateTopic(id: string, input: UpdateTopicInput): Promise<StudyTopic> {
    const parsedInput = updateTopicSchema.safeParse(input);

    if (!parsedInput.success) {
      throw new AppError("Los datos del tema no son validos.", APP_ERROR_CODES.VALIDATION_ERROR);
    }

    if (Object.keys(parsedInput.data).length === 0) {
      throw new AppError(
        "Debes enviar al menos un cambio para actualizar el tema.",
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    return this.topicRepository.update(id, parsedInput.data);
  }

  async deleteTopic(id: string): Promise<void> {
    const topic = await this.topicRepository.findById(id);

    if (!topic) {
      throw new AppError("El tema solicitado no existe.", APP_ERROR_CODES.TOPIC_NOT_FOUND);
    }

    await this.flashcardRepository?.deleteByTopicId(id);
    await this.topicRepository.delete(id);
  }
}
