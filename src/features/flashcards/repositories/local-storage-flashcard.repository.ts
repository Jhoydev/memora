import { nowIsoString } from "@/lib/dates/date.utils";
import { AppError, APP_ERROR_CODES } from "@/lib/errors/app-error";
import { createId } from "@/lib/ids/id.utils";
import { LocalStorageClient } from "@/lib/storage/local-storage.client";
import { STORAGE_KEYS } from "@/lib/storage/storage-keys";
import type {
  CreateFlashcardInput,
  UpdateFlashcardInput,
} from "../domain/flashcard.schema";
import type { Flashcard } from "../domain/flashcard.types";
import type { FlashcardRepository } from "./flashcard.repository";

export class LocalStorageFlashcardRepository implements FlashcardRepository {
  constructor(private readonly storageClient = new LocalStorageClient()) {}

  async findByTopicId(topicId: string): Promise<Flashcard[]> {
    const flashcards = await this.getAll();
    return flashcards.filter((flashcard) => flashcard.topicId === topicId);
  }

  async findById(id: string): Promise<Flashcard | null> {
    const flashcards = await this.getAll();
    return flashcards.find((flashcard) => flashcard.id === id) ?? null;
  }

  async create(input: CreateFlashcardInput): Promise<Flashcard> {
    const flashcards = await this.getAll();
    const timestamp = nowIsoString();

    const flashcard: Flashcard = {
      id: createId(),
      topicId: input.topicId,
      front: input.front,
      back: input.back,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.storageClient.setItem(STORAGE_KEYS.FLASHCARDS, [...flashcards, flashcard]);

    return flashcard;
  }

  async update(id: string, input: UpdateFlashcardInput): Promise<Flashcard> {
    const flashcards = await this.getAll();
    const flashcardIndex = flashcards.findIndex((flashcard) => flashcard.id === id);

    if (flashcardIndex === -1) {
      throw new AppError(
        "La flashcard solicitada no existe.",
        APP_ERROR_CODES.FLASHCARD_NOT_FOUND,
      );
    }

    const currentFlashcard = flashcards[flashcardIndex];
    const updatedFlashcard: Flashcard = {
      ...currentFlashcard,
      ...input,
      updatedAt: nowIsoString(),
    };

    const nextFlashcards = [...flashcards];
    nextFlashcards[flashcardIndex] = updatedFlashcard;

    this.storageClient.setItem(STORAGE_KEYS.FLASHCARDS, nextFlashcards);

    return updatedFlashcard;
  }

  async delete(id: string): Promise<void> {
    const flashcards = await this.getAll();
    const exists = flashcards.some((flashcard) => flashcard.id === id);

    if (!exists) {
      throw new AppError(
        "La flashcard solicitada no existe.",
        APP_ERROR_CODES.FLASHCARD_NOT_FOUND,
      );
    }

    this.storageClient.setItem(
      STORAGE_KEYS.FLASHCARDS,
      flashcards.filter((flashcard) => flashcard.id !== id),
    );
  }

  async deleteByTopicId(topicId: string): Promise<void> {
    const flashcards = await this.getAll();

    this.storageClient.setItem(
      STORAGE_KEYS.FLASHCARDS,
      flashcards.filter((flashcard) => flashcard.topicId !== topicId),
    );
  }

  private async getAll(): Promise<Flashcard[]> {
    return this.storageClient.getItem<Flashcard[]>(STORAGE_KEYS.FLASHCARDS, []);
  }
}
