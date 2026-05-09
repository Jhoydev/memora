import { nowIsoString } from "@/lib/dates/date.utils";
import { AppError, APP_ERROR_CODES } from "@/lib/errors/app-error";
import { createId } from "@/lib/ids/id.utils";
import { LocalStorageClient } from "@/lib/storage/local-storage.client";
import { STORAGE_KEYS } from "@/lib/storage/storage-keys";
import type { CreateTopicInput, UpdateTopicInput } from "../domain/topic.schema";
import type { StudyTopic } from "../domain/topic.types";
import type { TopicRepository } from "./topic.repository";

export class LocalStorageTopicRepository implements TopicRepository {
  constructor(private readonly storageClient = new LocalStorageClient()) {}

  async findAll(): Promise<StudyTopic[]> {
    return this.storageClient.getItem<StudyTopic[]>(STORAGE_KEYS.TOPICS, []);
  }

  async findById(id: string): Promise<StudyTopic | null> {
    const topics = await this.findAll();
    return topics.find((topic) => topic.id === id) ?? null;
  }

  async create(input: CreateTopicInput): Promise<StudyTopic> {
    const topics = await this.findAll();
    const timestamp = nowIsoString();

    const topic: StudyTopic = {
      id: createId(),
      name: input.name,
      color: input.color,
      icon: input.icon,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.storageClient.setItem(STORAGE_KEYS.TOPICS, [...topics, topic]);

    return topic;
  }

  async update(id: string, input: UpdateTopicInput): Promise<StudyTopic> {
    const topics = await this.findAll();
    const topicIndex = topics.findIndex((topic) => topic.id === id);

    if (topicIndex === -1) {
      throw new AppError("El tema solicitado no existe.", APP_ERROR_CODES.TOPIC_NOT_FOUND);
    }

    const currentTopic = topics[topicIndex];
    const updatedTopic: StudyTopic = {
      ...currentTopic,
      ...input,
      updatedAt: nowIsoString(),
    };

    const nextTopics = [...topics];
    nextTopics[topicIndex] = updatedTopic;

    this.storageClient.setItem(STORAGE_KEYS.TOPICS, nextTopics);

    return updatedTopic;
  }

  async delete(id: string): Promise<void> {
    const topics = await this.findAll();
    const exists = topics.some((topic) => topic.id === id);

    if (!exists) {
      throw new AppError("El tema solicitado no existe.", APP_ERROR_CODES.TOPIC_NOT_FOUND);
    }

    this.storageClient.setItem(
      STORAGE_KEYS.TOPICS,
      topics.filter((topic) => topic.id !== id),
    );
  }
}
