import { AppError } from "@/lib/errors/app-error";
import { LocalStorageClient } from "./local-storage.client";

describe("LocalStorageClient", () => {
  const client = new LocalStorageClient();

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reads and writes typed values", () => {
    client.setItem("topic", { id: "1", name: "Biologia" });

    expect(client.getItem("topic", null)).toEqual({
      id: "1",
      name: "Biologia",
    });
  });

  it("returns fallback when the key does not exist", () => {
    expect(client.getItem("missing", ["fallback"])).toEqual(["fallback"]);
  });

  it("detects if a key exists", () => {
    expect(client.hasKey("topics")).toBe(false);
    client.setItem("topics", []);
    expect(client.hasKey("topics")).toBe(true);
  });

  it("removes a stored key", () => {
    client.setItem("topics", [{ id: "1" }]);
    client.removeItem("topics");

    expect(client.hasKey("topics")).toBe(false);
  });

  it("throws AppError when parsing invalid JSON", () => {
    window.localStorage.setItem("broken", "{invalid");

    expect(() => client.getItem("broken", [])).toThrow(AppError);
  });
});
