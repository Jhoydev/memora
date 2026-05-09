import { StudyScreen } from "@/features/study/components/StudyScreen";

type TopicStudyPageProps = {
  params: Promise<{
    topicId: string;
  }>;
};

export default async function TopicStudyPage({ params }: TopicStudyPageProps) {
  const { topicId } = await params;

  return <StudyScreen topicId={topicId} />;
}
