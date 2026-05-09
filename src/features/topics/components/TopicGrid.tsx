import type { StudyTopic } from "../domain/topic.types";
import { TopicCard } from "./TopicCard";

type TopicGridProps = {
  topics: StudyTopic[];
  onEdit: (topic: StudyTopic) => void;
  onDelete: (topic: StudyTopic) => void;
};

export function TopicGrid({ topics, onEdit, onDelete }: TopicGridProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {topics.map((topic) => (
        <TopicCard key={topic.id} topic={topic} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
