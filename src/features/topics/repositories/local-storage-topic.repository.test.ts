import { STORAGE_KEYS } from "@/lib/storage/storage-keys";
import { LocalStorageTopicRepository } from "./local-storage-topic.repository";

describe("LocalStorageTopicRepository", () => {
  const repository = new LocalStorageTopicRepository();

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates and lists topics", async () => {
    const created = await repository.create({
      name: "Historia",
      color: "#f97316",
      icon: "landmark",
    });

    const topics = await repository.findAll();

    expect(topics).toHaveLength(1);
    expect(topics[0]).toMatchObject({
      id: created.id,
      name: "Historia",
      color: "#f97316",
    });
    expect(window.localStorage.getItem(STORAGE_KEYS.TOPICS)).toContain("Historia");
  });

  it("updates an existing topic", async () => {
    const created = await repository.create({
      name: "Historia",
      color: "#f97316",
      icon: "landmark",
    });

    const updated = await repository.update(created.id, {
      name: "Historia moderna",
    });

    expect(updated.name).toBe("Historia moderna");
    expect(await repository.findById(created.id)).toMatchObject({
      id: created.id,
      name: "Historia moderna",
      color: "#f97316",
    });
  });

  it("deletes an existing topic", async () => {
    const created = await repository.create({
      name: "Historia",
      color: "#f97316",
      icon: "landmark",
    });

    await repository.delete(created.id);

    expect(await repository.findAll()).toHaveLength(0);
  });
});
