import reducer, {
  clearWorkspaceSession,
  createActiveWorkspaceMock,
  createInitialWorkspace,
  createWorkspace,
  renameWorkspace,
  selectWorkspace,
} from "../workspaces-slice";

const owner = {
  userId: "user:ada@postmade.app",
  userName: "Ada Lovelace",
  userEmail: "ada@postmade.app",
};

describe("workspacesSlice", () => {
  it("removes all workspace data when the session ends", () => {
    const authenticatedState = reducer(
      undefined,
      createInitialWorkspace(owner)
    );
    const state = reducer(authenticatedState, clearWorkspaceSession());

    expect(state.items).toEqual([]);
    expect(state.activeWorkspaceId).toBeNull();
  });

  it("creates the initial workspace with the trial configuration", () => {
    const state = reducer(undefined, createInitialWorkspace(owner));
    const workspace = state.items[0]!;

    expect(workspace.name).toBe("Workspace de Ada Lovelace");
    expect(workspace.subscriptionConfiguration).toEqual({
      channels: 3,
      members: 1,
    });
    expect(workspace.subscriptionStatus).toBe("trialing");
    expect(workspace.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: owner.userId, role: "owner" }),
      ])
    );
    expect(workspace.resources).toEqual({
      posts: [],
      selectedCalendarDate: null,
    });
    expect(state.activeWorkspaceId).toBe(workspace.id);
  });

  it("creates an idempotent active workspace mock with contracted resources", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    state = reducer(state, createActiveWorkspaceMock(owner));
    state = reducer(state, createActiveWorkspaceMock(owner));

    const activeWorkspace = state.items.find(
      (workspace) => workspace.subscriptionStatus === "active"
    );
    expect(state.items).toHaveLength(2);
    expect(activeWorkspace).toEqual(
      expect.objectContaining({
        name: "Postmade Studio",
        ownerId: owner.userId,
        subscriptionConfiguration: { channels: 8, members: 3 },
        billing: expect.objectContaining({
          currency: "BRL",
          nextInvoiceAmount: 22_900,
          paymentMethodLast4: "4242",
        }),
      })
    );
    expect(activeWorkspace?.members).toHaveLength(3);
  });

  it("keeps each created workspace independent and only allows a member to select it", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const firstId = state.activeWorkspaceId!;
    state = reducer(state, createWorkspace({ ...owner, name: "Cliente ACME" }));
    const secondId = state.activeWorkspaceId!;

    expect(secondId).not.toBe(firstId);
    expect(state.items).toHaveLength(2);
    state = reducer(
      state,
      selectWorkspace({ workspaceId: firstId, userId: "stranger" })
    );
    expect(state.activeWorkspaceId).toBe(secondId);
    state = reducer(
      state,
      selectWorkspace({ workspaceId: firstId, userId: owner.userId })
    );
    expect(state.activeWorkspaceId).toBe(firstId);
  });

  it("limits renaming to workspace managers", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const workspaceId = state.activeWorkspaceId!;
    state = reducer(
      state,
      renameWorkspace({ workspaceId, name: "Blocked", actorId: "stranger" })
    );
    expect(state.items[0]!.name).toBe("Workspace de Ada Lovelace");
    state = reducer(
      state,
      renameWorkspace({
        workspaceId,
        name: "Minha marca",
        actorId: owner.userId,
      })
    );
    expect(state.items[0]!.name).toBe("Minha marca");
  });
});
