import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/test/query-test-utils";
import { useCreateTopicMutation } from "./use-create-topic-mutation";

vi.mock("../services/topic-service.factory", () => ({
  topicService: {
    createTopic: vi.fn(async (input: { name: string; color: string; icon?: string }) => ({
      id: "topic-1",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
      ...input,
    })),
  },
}));

describe("useCreateTopicMutation", () => {
  it("creates a topic successfully", async () => {
    const wrapper = createQueryWrapper();
    const { result } = renderHook(() => useCreateTopicMutation(), { wrapper });

    result.current.mutate({
      name: "Idiomas",
      color: "#0ea5e9",
      icon: "languages",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
