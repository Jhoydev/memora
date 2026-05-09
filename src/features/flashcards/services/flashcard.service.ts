import { AppError, APP_ERROR_CODES } from "@/lib/errors/app-error";
import type { TopicRepository } from "@/features/topics/repositories/topic.repository";
import {
  createFlashcardSchema,
  updateFlashcardSchema,
  type CreateFlashcardInput,
  type UpdateFlashcardInput,
} from "../domain/flashcard.schema";
import type { Flashcard } from "../domain/flashcard.types";
import type { FlashcardRepository } from "../repositories/flashcard.repository";

export class FlashcardService {
  constructor(
    private readonly flashcardRepository: FlashcardRepository,
    private readonly topicRepository: TopicRepository,
  ) {}

  async getFlashcardsByTopic(topicId: string): Promise<Flashcard[]> {
    return this.flashcardRepository.findByTopicId(topicId);
  }

  async getFlashcardById(id: string): Promise<Flashcard | null> {
    return this.flashcardRepository.findById(id);
  }

  async createFlashcard(input: CreateFlashcardInput): Promise<Flashcard> {
    const parsedInput = createFlashcardSchema.safeParse(input);

    if (!parsedInput.success) {
      throw new AppError(
        "Los datos de la flashcard no son validos.",
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const topic = await this.topicRepository.findById(parsedInput.data.topicId);

    if (!topic) {
      throw new AppError(
        "No se puede crear una flashcard para un tema inexistente.",
        APP_ERROR_CODES.TOPIC_NOT_FOUND,
      );
    }

    return this.flashcardRepository.create(parsedInput.data);
  }

  async updateFlashcard(id: string, input: UpdateFlashcardInput): Promise<Flashcard> {
    const parsedInput = updateFlashcardSchema.safeParse(input);

    if (!parsedInput.success) {
      throw new AppError(
        "Los datos de la flashcard no son validos.",
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (Object.keys(parsedInput.data).length === 0) {
      throw new AppError(
        "Debes enviar al menos un cambio para actualizar la flashcard.",
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    return this.flashcardRepository.update(id, parsedInput.data);
  }

  async deleteFlashcard(id: string): Promise<void> {
    const flashcard = await this.flashcardRepository.findById(id);

    if (!flashcard) {
      throw new AppError(
        "La flashcard solicitada no existe.",
        APP_ERROR_CODES.FLASHCARD_NOT_FOUND,
      );
    }

    await this.flashcardRepository.delete(id);
  }

  async deleteFlashcardsByTopic(topicId: string): Promise<void> {
    await this.flashcardRepository.deleteByTopicId(topicId);
  }
}
