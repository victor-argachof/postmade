import { beforeEach, describe, expect, it, vi } from "vitest";

describe("API-backed store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });
  it("removes legacy domain persistence", async () => {
    const keys = [
      "postmade.auth-session.v1",
      "postmade.workspaces.v1",
      "postmade.workspaces.v2",
      "postmade.workspaces.v3",
      "postmade.workspaces.v4",
    ];
    for (const key of keys) window.localStorage.setItem(key, "legacy");
    const { store } = await import("../index");
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().workspaces.items).toEqual([]);
    for (const key of keys) expect(window.localStorage.getItem(key)).toBeNull();
  });
});
