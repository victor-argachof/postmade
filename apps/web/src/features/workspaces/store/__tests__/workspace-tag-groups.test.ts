import reducer, {
  createInitialWorkspace,
  createWorkspace,
  createWorkspacePublication,
  createWorkspaceTagGroup,
  deleteWorkspaceTagGroup,
  updateWorkspaceTagGroup,
} from "../workspaces-slice";

const owner = {
  userId: "owner-1",
  userName: "Owner",
  userEmail: "owner@postmade.app",
};

describe("workspace tag groups", () => {
  it("normalizes CRUD operations and isolates groups by workspace", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const firstId = state.activeWorkspaceId!;
    state = reducer(
      state,
      createWorkspaceTagGroup({
        workspaceId: firstId,
        actorId: owner.userId,
        name: "Marketing",
        tags: ["#Postmade", "postmade", "criação"],
      })
    );
    state = reducer(
      state,
      createWorkspaceTagGroup({
        workspaceId: firstId,
        actorId: owner.userId,
        name: "marketing",
        tags: ["duplicate"],
      })
    );
    expect(state.items[0]!.resources.tagGroups).toHaveLength(1);
    expect(state.items[0]!.resources.tagGroups[0]!.tags).toEqual([
      "Postmade",
      "criação",
    ]);
    const groupId = state.items[0]!.resources.tagGroups[0]!.id;
    state = reducer(
      state,
      updateWorkspaceTagGroup({
        workspaceId: firstId,
        actorId: owner.userId,
        tagGroupId: groupId,
        name: "Campanhas",
        tags: ["social"],
      })
    );
    state = reducer(state, createWorkspace({ name: "Second", ...owner }));
    expect(
      state.items.find((workspace) => workspace.id === firstId)!.resources
        .tagGroups[0]!.name
    ).toBe("Campanhas");
    expect(
      state.items.find((workspace) => workspace.id !== firstId)!.resources
        .tagGroups
    ).toEqual([]);
  });

  it("blocks viewers and preserves publication snapshots after deletion", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const workspaceId = state.activeWorkspaceId!;
    state = {
      ...state,
      items: state.items.map((workspace) => ({
        ...workspace,
        members: [
          ...workspace.members,
          {
            id: "viewer",
            name: "Viewer",
            email: "viewer@postmade.app",
            role: "viewer" as const,
            joinedAt: new Date().toISOString(),
          },
        ],
      })),
    };
    state = reducer(
      state,
      createWorkspaceTagGroup({
        workspaceId,
        actorId: "viewer",
        name: "Blocked",
        tags: ["blocked"],
      })
    );
    state = reducer(
      state,
      createWorkspaceTagGroup({
        workspaceId,
        actorId: owner.userId,
        name: "Saved",
        tags: ["snapshot"],
      })
    );
    const group = state.items[0]!.resources.tagGroups[0]!;
    state = reducer(
      state,
      createWorkspacePublication({
        workspaceId,
        actorId: owner.userId,
        publication: {
          id: "post",
          createdBy: owner.userId,
          status: "draft",
          content: "",
          media: [],
          targets: [],
          tagGroupSnapshots: [
            { groupId: group.id, groupName: group.name, tags: [...group.tags] },
          ],
          scheduledFor: null,
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );
    state = reducer(
      state,
      deleteWorkspaceTagGroup({
        workspaceId,
        actorId: owner.userId,
        tagGroupId: group.id,
      })
    );
    expect(state.items[0]!.resources.tagGroups).toEqual([]);
    expect(state.items[0]!.resources.posts[0]!.tagGroupSnapshots).toEqual([
      { groupId: group.id, groupName: "Saved", tags: ["snapshot"] },
    ]);
  });
});
