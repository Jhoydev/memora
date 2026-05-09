import { STORAGE_KEYS } from "@/lib/storage/storage-keys";
import { LocalStorageFlashcardRepository } from "./local-storage-flashcard.repository";

describe("LocalStorageFlashcardRepository", () => {
  const repository = new LocalStorageFlashcardRepository();

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates flashcards and filters them by topicId", async () => {
    await repository.create({
      topicId: "topic-1",
      front: "Capital de Peru",
      back: "Lima",
    });
    await repository.create({
      topicId: "topic-2",
      front: "Capital de Francia",
      back: "Paris",
    });

    const flashcards = await repository.findByTopicId("topic-1");

    expect(flashcards).toHaveLength(1);
    expect(flashcards[0]?.front).toBe("Capital de Peru");
    expect(window.localStorage.getItem(STORAGE_KEYS.FLASHCARDS)).toContain("Paris");
  });

  it("updates an existing flashcard", async () => {
    const created = await repository.create({
      topicId: "topic-1",
      front: "Capital de Peru",
      back: "Lima",
    });

    const updated = await repository.update(created.id, {
      back: "Lima, Peru",
    });

    expect(updated.back).toBe("Lima, Peru");
  });

  it("deletes all flashcards for a topic", async () => {
    await repository.create({
      topicId: "topic-1",
      front: "Uno",
      back: "One",
    });
    await repository.create({
      topicId: "topic-1",
      front: "Dos",
      back: "Two",
    });
    await repository.create({
      topicId: "topic-2",
      front: "Tres",
      back: "Three",
    });

    await repository.deleteByTopicId("topic-1");

    expect(await repository.findByTopicId("topic-1")).toHaveLength(0);
    expect(await repository.findByTopicId("topic-2")).toHaveLength(1);
  });
});
