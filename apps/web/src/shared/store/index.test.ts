import { beforeEach, describe, expect, it, vi } from "vitest";

describe("workspace persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });

  it("discards v1 workspaces without clearing authentication storage", async () => {
    window.localStorage.setItem("postmade.workspaces.v1", JSON.stringify({
      activeWorkspaceId: "legacy-workspace",
      items: [{ id: "legacy-workspace" }],
    }));
    window.localStorage.setItem("postmade.auth-session.v1", JSON.stringify({ user: null, accounts: [] }));

    const { store } = await import("./index");

    expect(store.getState().workspaces.items).toEqual([]);
    expect(window.localStorage.getItem("postmade.workspaces.v1")).toBeNull();
    expect(window.localStorage.getItem("postmade.auth-session.v1")).not.toBeNull();
  });
});
