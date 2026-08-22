import reducer, {
  acceptInvitation,
  clearWorkspaceSession,
  createActiveWorkspaceMock,
  createConnectedChannelMock,
  createInitialWorkspace,
  createWorkspace,
  disconnectWorkspaceChannel,
  inviteMember,
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
      channels: [],
      posts: [],
      tagGroups: [],
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

  it("stores three development channel mocks in the active workspace", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    state = reducer(
      state,
      createConnectedChannelMock({ userId: owner.userId })
    );
    state = reducer(
      state,
      createConnectedChannelMock({ userId: owner.userId })
    );

    expect(state.items[0]!.resources.channels).toEqual([
      expect.objectContaining({ platform: "instagram", connected: true }),
      expect.objectContaining({ platform: "linkedin", connected: true }),
      expect.objectContaining({ platform: "facebook", connected: true }),
    ]);
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

  it("blocks invitations during the trial and accepts them after a subscription with more members activates", () => {
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

    state = {
      ...state,
      items: state.items.map((workspace) =>
        workspace.id === workspaceId
          ? {
              ...workspace,
              subscriptionConfiguration: { channels: 3, members: 5 },
              subscriptionStatus: "active" as const,
            }
          : workspace
      ),
    };
    state = reducer(state, inviteMember(invitationInput));
    const invitation = state.items[0]!.invitations[0]!;
    expect(invitation.status).toBe("pending");

    state = reducer(
      state,
      acceptInvitation({
        token: invitation.token,
        userId: "user:grace@postmade.app",
        userName: "Grace Hopper",
        userEmail: "different@postmade.app",
        acceptedAt: new Date().toISOString(),
      })
    );
    expect(state.items[0]!.members).toHaveLength(1);

    state = reducer(
      state,
      acceptInvitation({
        token: invitation.token,
        userId: "user:grace@postmade.app",
        userName: "Grace Hopper",
        userEmail: "grace@postmade.app",
        acceptedAt: new Date().toISOString(),
      })
    );
    expect(state.items[0]!.members[1]).toEqual(
      expect.objectContaining({
        email: "grace@postmade.app",
        role: "editor",
      })
    );
    expect(state.activeWorkspaceId).toBe(workspaceId);
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

  it("counts pending invitations against the configured member allowance", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const workspaceId = state.activeWorkspaceId!;
    state = {
      ...state,
      items: state.items.map((workspace) => ({
        ...workspace,
        subscriptionStatus: "active" as const,
        subscriptionConfiguration: { channels: 3, members: 2 },
      })),
    };

    state = reducer(
      state,
      inviteMember({
        workspaceId,
        actorId: owner.userId,
        email: "first@postmade.app",
        role: "editor",
      })
    );
    state = reducer(
      state,
      inviteMember({
        workspaceId,
        actorId: owner.userId,
        email: "second@postmade.app",
        role: "viewer",
      })
    );

    expect(
      state.items[0]!.invitations.filter(
        (invitation) => invitation.status === "pending"
      )
    ).toHaveLength(1);
  });

  it("disconnects a Facebook channel only for a manager of its workspace", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const workspaceId = state.activeWorkspaceId!;
    state = {
      ...state,
      items: state.items.map((workspace) =>
        workspace.id === workspaceId
          ? {
              ...workspace,
              resources: {
                ...workspace.resources,
                channels: [
                  {
                    id: "facebook-1",
                    platform: "facebook",
                    displayName: "Postmade",
                    username: "postmade",
                    connected: true,
                  },
                ],
              },
              members: [
                ...workspace.members,
                {
                  id: "editor-1",
                  name: "Editor",
                  email: "editor@postmade.app",
                  role: "editor" as const,
                  joinedAt: new Date().toISOString(),
                },
              ],
            }
          : workspace
      ),
    };

    state = reducer(
      state,
      disconnectWorkspaceChannel({
        workspaceId,
        channelId: "facebook-1",
        actorId: "editor-1",
      })
    );
    expect(state.items[0]!.resources.channels).toHaveLength(1);

    state = reducer(
      state,
      disconnectWorkspaceChannel({
        workspaceId,
        channelId: "facebook-1",
        actorId: owner.userId,
      })
    );
    expect(state.items[0]!.resources.channels).toHaveLength(0);
  });

  it("does not disconnect a channel from a different workspace", () => {
    let state = reducer(undefined, createInitialWorkspace(owner));
    const firstWorkspaceId = state.activeWorkspaceId!;
    state = {
      ...state,
      items: state.items.map((workspace) =>
        workspace.id === firstWorkspaceId
          ? {
              ...workspace,
              resources: {
                ...workspace.resources,
                channels: [
                  {
                    id: "youtube-1",
                    platform: "youtube",
                    displayName: "Postmade TV",
                    username: "@postmade",
                    connected: true,
                  },
                ],
              },
            }
          : workspace
      ),
    };
    state = reducer(
      state,
      createWorkspace({ ...owner, name: "Second workspace" })
    );

    state = reducer(
      state,
      disconnectWorkspaceChannel({
        workspaceId: state.activeWorkspaceId!,
        channelId: "youtube-1",
        actorId: owner.userId,
      })
    );

    expect(
      state.items.find((item) => item.id === firstWorkspaceId)?.resources
        .channels
    ).toHaveLength(1);
  });
});
