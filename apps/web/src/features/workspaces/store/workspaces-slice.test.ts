import reducer, {
  acceptInvitation,
  createInitialWorkspace,
  createWorkspace,
  inviteMember,
  renameWorkspace,
  selectWorkspace,
  setWorkspacePlan,
} from "./workspaces-slice";

const owner = {
  userId: "user:ada@postmade.app",
  userName: "Ada Lovelace",
  userEmail: "ada@postmade.app",
};

describe("workspacesSlice", () => {
  it("creates the initial workspace with an isolated trial and the creator as owner", () => {
    const state = reducer(undefined, createInitialWorkspace(owner));
    const workspace = state.items[0]!;

    expect(workspace.name).toBe("Workspace de Ada Lovelace");
    expect(workspace.plan).toBe("creator");
    expect(workspace.subscriptionStatus).toBe("trialing");
    expect(workspace.members).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: owner.userId, role: "owner" }),
    ]));
    expect(workspace.resources).toEqual({ channels: [], posts: [], selectedCalendarDate: null });
    expect(state.activeWorkspaceId).toBe(workspace.id);
  });

  it("keeps each created workspace independent and only allows a member to select it", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const firstId = state.activeWorkspaceId!;
    state = reducer(state, createWorkspace({ ...owner, name: "Cliente ACME" }));
    const secondId = state.activeWorkspaceId!;

    expect(secondId).not.toBe(firstId);
    expect(state.items).toHaveLength(2);
    state = reducer(state, selectWorkspace({ workspaceId: firstId, userId: "stranger" }));
    expect(state.activeWorkspaceId).toBe(secondId);
    state = reducer(state, selectWorkspace({ workspaceId: firstId, userId: owner.userId }));
    expect(state.activeWorkspaceId).toBe(firstId);
  });

  it("blocks invitations on Creator and accepts them after this workspace upgrades", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const workspaceId = state.activeWorkspaceId!;
    const invitationInput = {
      workspaceId,
      actorId: owner.userId,
      email: "grace@postmade.app",
      role: "editor" as const,
    };

    state = reducer(state, inviteMember(invitationInput));
    expect(state.items[0]!.invitations).toHaveLength(0);

    state = reducer(state, setWorkspacePlan({ workspaceId, plan: "growth", actorId: owner.userId }));
    expect(state.items[0]).toEqual(expect.objectContaining({
      plan: "growth",
      subscriptionStatus: "trialing",
    }));
    state = reducer(state, inviteMember(invitationInput));
    const invitation = state.items[0]!.invitations[0]!;
    expect(invitation.status).toBe("pending");

    state = reducer(state, acceptInvitation({
      token: invitation.token,
      userId: "user:grace@postmade.app",
      userName: "Grace Hopper",
      userEmail: "different@postmade.app",
      acceptedAt: new Date().toISOString(),
    }));
    expect(state.items[0]!.members).toHaveLength(1);

    state = reducer(state, acceptInvitation({
      token: invitation.token,
      userId: "user:grace@postmade.app",
      userName: "Grace Hopper",
      userEmail: "grace@postmade.app",
      acceptedAt: new Date().toISOString(),
    }));
    expect(state.items[0]!.members[1]).toEqual(expect.objectContaining({
      email: "grace@postmade.app",
      role: "editor",
    }));
    expect(state.activeWorkspaceId).toBe(workspaceId);
  });

  it("limits renaming to workspace managers", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const workspaceId = state.activeWorkspaceId!;
    state = reducer(state, renameWorkspace({ workspaceId, name: "Blocked", actorId: "stranger" }));
    expect(state.items[0]!.name).toBe("Workspace de Ada Lovelace");
    state = reducer(state, renameWorkspace({ workspaceId, name: "Minha marca", actorId: owner.userId }));
    expect(state.items[0]!.name).toBe("Minha marca");
  });
});
