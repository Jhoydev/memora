import { render, screen } from "@testing-library/react";
import { TopicCard } from "@/features/topics/components/TopicCard";
import { StudySummary } from "@/features/study/components/StudySummary";

describe("App flow smoke", () => {
  it("renders navigation entry points for topic detail and study return", () => {
    render(
      <>
        <TopicCard
          topic={{
            id: "topic-1",
            name: "Historia",
            color: "#f97316",
            icon: "landmark",
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01",
          }}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
        <StudySummary
          topicId="topic-1"
          onRestart={vi.fn()}
          result={{
            topicId: "topic-1",
            totalCards: 3,
            knownCards: 2,
            unknownCards: 1,
          }}
        />
      </>,
    );

    expect(screen.getByRole("link", { name: /abrir tema/i })).toHaveAttribute(
      "href",
      "/topics/topic-1",
    );
    expect(screen.getByRole("link", { name: /volver al tema/i })).toHaveAttribute(
      "href",
      "/topics/topic-1",
    );
  });
});
