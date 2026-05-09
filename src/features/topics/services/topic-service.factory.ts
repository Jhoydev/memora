import { LocalStorageFlashcardRepository } from "@/features/flashcards/repositories/local-storage-flashcard.repository";
import { LocalStorageTopicRepository } from "../repositories/local-storage-topic.repository";
import { TopicService } from "./topic.service";

const topicRepository = new LocalStorageTopicRepository();
const flashcardRepository = new LocalStorageFlashcardRepository();

export const topicService = new TopicService(topicRepository, flashcardRepository);
