import type {
  CreateFlashcardInput,
  UpdateFlashcardInput,
} from "../domain/flashcard.schema";
import type { Flashcard } from "../domain/flashcard.types";

export interface FlashcardRepository {
  findByTopicId(topicId: string): Promise<Flashcard[]>;
  findById(id: string): Promise<Flashcard | null>;
  create(input: CreateFlashcardInput): Promise<Flashcard>;
  update(id: string, input: UpdateFlashcardInput): Promise<Flashcard>;
  delete(id: string): Promise<void>;
  deleteByTopicId(topicId: string): Promise<void>;
}
