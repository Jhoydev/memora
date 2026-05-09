import type { CreateTopicInput, UpdateTopicInput } from "../domain/topic.schema";
import type { StudyTopic } from "../domain/topic.types";

export interface TopicRepository {
  findAll(): Promise<StudyTopic[]>;
  findById(id: string): Promise<StudyTopic | null>;
  create(input: CreateTopicInput): Promise<StudyTopic>;
  update(id: string, input: UpdateTopicInput): Promise<StudyTopic>;
  delete(id: string): Promise<void>;
}
