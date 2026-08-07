import type { ScheduledPublication } from "@postmade/types";

import reducer, {
  cancelWorkspacePublication,
  createInitialWorkspace,
  createWorkspacePublication,
  duplicateWorkspacePublication,
  updateWorkspaceTimezone,
} from "../workspaces-slice";

const owner = {
  userId: "owner-1",
  userName: "Owner",
  userEmail: "owner@postmade.app",
};
const publication = (
  id: string,
  status: ScheduledPublication["status"]
): ScheduledPublication => ({
  id,
  createdBy: owner.userId,
  status,
  content: `Content ${id}`,
  media: [],
  targets: [
    {
      channelId: "channel-1",
      platform: "linkedin",
      contentOverride: null,
      mediaOverride: null,
      settings: {},
      status,
      errorCode: null,
      externalUrl: null,
    },
  ],
  scheduledFor: status === "scheduled" ? "2027-01-01T12:00:00.000Z" : null,
  publishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("workspace publications", () => {
  it("creates, cancels and duplicates publications inside the workspace", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const workspaceId = state.activeWorkspaceId!;
    state = reducer(
      state,
      createWorkspacePublication({
        workspaceId,
        actorId: owner.userId,
        publication: publication("one", "scheduled"),
      })
    );
    state = reducer(
      state,
      cancelWorkspacePublication({
        workspaceId,
        actorId: owner.userId,
        publicationId: "one",
      })
    );
    state = reducer(
      state,
      duplicateWorkspacePublication({
        workspaceId,
        actorId: owner.userId,
        sourceId: "one",
      })
    );
    expect(state.items[0]!.resources.posts).toHaveLength(2);
    expect(
      state.items[0]!.resources.posts.every((post) => post.status === "draft")
    ).toBe(true);
    expect(
      new Set(state.items[0]!.resources.posts.map((post) => post.id)).size
    ).toBe(2);
  });

  it("blocks the fourth non-draft publication during trial", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const workspaceId = state.activeWorkspaceId!;
    for (const id of ["one", "two", "three", "four"])
      state = reducer(
        state,
        createWorkspacePublication({
          workspaceId,
          actorId: owner.userId,
          publication: publication(id, "scheduled"),
        })
      );
    expect(state.items[0]!.resources.posts).toHaveLength(3);
  });

  it("updates the workspace timezone without changing scheduled instants", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const workspaceId = state.activeWorkspaceId!;
    state = reducer(
      state,
      createWorkspacePublication({
        workspaceId,
        actorId: owner.userId,
        publication: publication("one", "scheduled"),
      })
    );
    const instant = state.items[0]!.resources.posts[0]!.scheduledFor;
    state = reducer(
      state,
      updateWorkspaceTimezone({
        workspaceId,
        actorId: owner.userId,
        timezone: "Europe/Lisbon",
      })
    );
    expect(state.items[0]!.timezone).toBe("Europe/Lisbon");
    expect(state.items[0]!.resources.posts[0]!.scheduledFor).toBe(instant);
  });
});
