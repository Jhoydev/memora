import { LocalStorageTopicRepository } from "@/features/topics/repositories/local-storage-topic.repository";
import { LocalStorageFlashcardRepository } from "../repositories/local-storage-flashcard.repository";
import { FlashcardService } from "./flashcard.service";

const flashcardRepository = new LocalStorageFlashcardRepository();
const topicRepository = new LocalStorageTopicRepository();

export const flashcardService = new FlashcardService(flashcardRepository, topicRepository);
