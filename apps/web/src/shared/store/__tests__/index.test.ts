import { beforeEach, describe, expect, it, vi } from "vitest";

describe("workspace persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });

  it("discards v1 workspaces without clearing authentication storage", async () => {
    window.localStorage.setItem(
      "postmade.workspaces.v1",
      JSON.stringify({
        activeWorkspaceId: "legacy-workspace",
        items: [{ id: "legacy-workspace" }],
      })
    );
    window.localStorage.setItem(
      "postmade.auth-session.v1",
      JSON.stringify({ user: null, accounts: [] })
    );

    const { store } = await import("../index");

    expect(store.getState().workspaces.items).toEqual([]);
    expect(window.localStorage.getItem("postmade.workspaces.v1")).toBeNull();
    expect(
      window.localStorage.getItem("postmade.auth-session.v1")
    ).not.toBeNull();
  });

  it("migrates valid v3 workspaces to v4 without losing data", async () => {
    const { default: reducer, createInitialWorkspace } =
      await import("@/features/workspaces/store/workspaces-slice");
    const previous = reducer(
      undefined,
      createInitialWorkspace({
        userId: "owner",
        userName: "Owner",
        userEmail: "owner@postmade.app",
      })
    );
    const legacy = structuredClone(previous) as typeof previous;
    delete (
      legacy.items[0]!.resources as Partial<
        (typeof legacy.items)[0]["resources"]
      >
    ).tagGroups;
    window.localStorage.setItem(
      "postmade.workspaces.v3",
      JSON.stringify(legacy)
    );

    vi.resetModules();
    const { store } = await import("../index");

    expect(store.getState().workspaces.items[0]!.name).toBe(
      previous.items[0]!.name
    );
    expect(store.getState().workspaces.items[0]!.resources.tagGroups).toEqual(
      []
    );
    expect(window.localStorage.getItem("postmade.workspaces.v3")).toBeNull();
  });
});
