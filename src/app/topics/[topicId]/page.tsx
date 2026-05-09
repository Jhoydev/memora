import { TopicDetailScreen } from "@/features/flashcards/components/TopicDetailScreen";

type TopicDetailPageProps = {
  params: Promise<{
    topicId: string;
  }>;
};

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const { topicId } = await params;

  return <TopicDetailScreen topicId={topicId} />;
}
