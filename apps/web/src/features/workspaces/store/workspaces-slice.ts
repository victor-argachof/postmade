import type { ScheduledPublication, SocialPlatform } from "@postmade/types";
import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

import { SUBSCRIPTION_INCLUDED_QUANTITIES } from "../lib/subscription-pricing";
import { WORKSPACE_TRIAL_LIMITS } from "../lib/workspace-limits";
import type { Workspace, WorkspaceRole } from "../types";

interface WorkspacesState {
  items: Workspace[];
  activeWorkspaceId: string | null;
}

const initialState: WorkspacesState = {
  items: [],
  activeWorkspaceId: null,
};

function trialEnd(startedAt: string) {
  const end = new Date(startedAt);
  end.setDate(end.getDate() + WORKSPACE_TRIAL_LIMITS.days);
  return end.toISOString();
}

function createOwnedWorkspace(payload: {
  id: string;
  name: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}): Workspace {
  return {
    id: payload.id,
    name: payload.name.trim(),
    ownerId: payload.userId,
    subscriptionConfiguration: { ...SUBSCRIPTION_INCLUDED_QUANTITIES },
    subscriptionStatus: "trialing",
    trialStartedAt: payload.createdAt,
    trialEndsAt: trialEnd(payload.createdAt),
    createdAt: payload.createdAt,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    members: [
      {
        id: payload.userId,
        name: payload.userName,
        email: payload.userEmail.toLowerCase(),
        role: "owner",
        joinedAt: payload.createdAt,
      },
    ],
    invitations: [],
    resources: {
      posts: [],
      selectedCalendarDate: null,
    },
  };
}

const workspacesSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {
    hydrateWorkspaces: (
      state,
      action: PayloadAction<
        Array<{
          id: string;
          name: string;
          ownerId: string;
          timezone: string;
          role: WorkspaceRole;
          subscriptionStatus: Workspace["subscriptionStatus"];
          subscriptionConfiguration: Workspace["subscriptionConfiguration"];
          trialStartedAt: string;
          trialEndsAt: string;
          createdAt: string;
          user: { id: string; name: string; email: string };
        }>
      >
    ) => {
      state.items = action.payload.map(({ user, role, ...workspace }) => ({
        ...workspace,
        members: [{ ...user, role, joinedAt: workspace.createdAt }],
        invitations: [],
        resources: {
          posts: [],
          selectedCalendarDate: null,
        },
      }));
      if (!state.items.some((item) => item.id === state.activeWorkspaceId))
        state.activeWorkspaceId = state.items[0]?.id ?? null;
    },
    createInitialWorkspace: {
      reducer: (
        state,
        action: PayloadAction<ReturnType<typeof prepareOwnedWorkspace>>
      ) => {
        const existingWorkspace = state.items.find((workspace) =>
          workspace.members.some(
            (member) => member.id === action.payload.userId
          )
        );
        if (existingWorkspace) {
          state.activeWorkspaceId = existingWorkspace.id;
          return;
        }
        const workspace = createOwnedWorkspace(action.payload);
        state.items.push(workspace);
        state.activeWorkspaceId = workspace.id;
      },
      prepare: (payload: {
        userId: string;
        userName: string;
        userEmail: string;
      }) => ({
        payload: prepareOwnedWorkspace({
          ...payload,
          name: `Workspace de ${payload.userName.trim()}`,
        }),
      }),
    },
    createWorkspace: {
      reducer: (
        state,
        action: PayloadAction<ReturnType<typeof prepareOwnedWorkspace>>
      ) => {
        const workspace = createOwnedWorkspace(action.payload);
        state.items.push(workspace);
        state.activeWorkspaceId = workspace.id;
      },
      prepare: (payload: {
        name: string;
        userId: string;
        userName: string;
        userEmail: string;
      }) => ({
        payload: prepareOwnedWorkspace(payload),
      }),
    },
    createActiveWorkspaceMock: (
      state,
      action: PayloadAction<{
        userId: string;
        userName: string;
        userEmail: string;
      }>
    ) => {
      const workspaceId = `development-active-workspace:${action.payload.userId}`;
      if (state.items.some((workspace) => workspace.id === workspaceId)) return;

      const createdAt = new Date().toISOString();
      const currentPeriodEndsAt = new Date();
      currentPeriodEndsAt.setMonth(currentPeriodEndsAt.getMonth() + 1);
      const workspace = createOwnedWorkspace({
        ...action.payload,
        id: workspaceId,
        name: "Postmade Studio",
        createdAt,
      });
      workspace.subscriptionConfiguration = { channels: 8, members: 3 };
      workspace.subscriptionStatus = "active";
      workspace.billing = {
        currentPeriodEndsAt: currentPeriodEndsAt.toISOString(),
        cancelAtPeriodEnd: false,
        currency: "BRL",
        nextInvoiceAmount: 22_900,
        paymentMethodBrand: "Visa",
        paymentMethodLast4: "4242",
      };
      workspace.members.push(
        {
          id: `${workspaceId}:admin`,
          name: "Marina Costa",
          email: "marina@postmade.app",
          role: "admin",
          joinedAt: createdAt,
        },
        {
          id: `${workspaceId}:editor`,
          name: "Lucas Lima",
          email: "lucas@postmade.app",
          role: "editor",
          joinedAt: createdAt,
        }
      );
      state.items.push(workspace);
    },
    createPublicationsMock: (
      state,
      action: PayloadAction<{ userId: string }>
    ) => {
      const workspace = state.items.find(
        (item) =>
          item.id === state.activeWorkspaceId &&
          item.members.some((member) => member.id === action.payload.userId)
      );
      if (
        !workspace ||
        workspace.resources.posts.some((post) =>
          post.id.startsWith("development-publication:")
        )
      )
        return;

      const instagram = {
        id: `development-instagram-channel:${workspace.id}`,
        platform: "instagram" as const,
      };
      const linkedin = {
        id: `development-linkedin-channel:${workspace.id}`,
        platform: "linkedin" as const,
      };
      const facebook = {
        id: `development-facebook-channel:${workspace.id}`,
        platform: "facebook" as const,
      };

      const now = Date.now();
      const instant = (hoursFromNow: number) =>
        new Date(now + hoursFromNow * 60 * 60 * 1000).toISOString();
      const target = (
        channel: { id: string; platform: SocialPlatform },
        status: ScheduledPublication["status"],
        options?: { errorCode?: string; externalUrl?: string }
      ): ScheduledPublication["targets"][number] => ({
        channelId: channel.id,
        platform: channel.platform,
        contentOverride: null,
        mediaOverride: null,
        settings: {},
        status,
        errorCode: options?.errorCode ?? null,
        externalUrl: options?.externalUrl ?? null,
      });
      const image = {
        id: "development-media:brand",
        type: "image" as const,
        url: "/favicon.png",
        filename: "postmade.png",
        mimeType: "image/png",
      };

      workspace.resources.posts.push(
        {
          id: "development-publication:draft",
          createdBy: action.payload.userId,
          status: "draft",
          content:
            "Ideias para a próxima semana: bastidores do produto e dicas de organização.",
          media: [],
          targets: [target(linkedin, "draft")],
          tagGroupSnapshots: [],
          scheduledFor: null,
          publishedAt: null,
          createdAt: instant(-48),
          updatedAt: instant(-3),
        },
        {
          id: "development-publication:scheduled-multichannel",
          createdBy: action.payload.userId,
          status: "scheduled",
          content:
            "Planejar, criar e publicar em todos os canais pode ser mais simples.",
          media: [image],
          targets: [
            target(instagram, "scheduled"),
            target(linkedin, "scheduled"),
            target(facebook, "scheduled"),
          ],
          tagGroupSnapshots: [
            {
              groupId: "development-tag-snapshot:product",
              groupName: "Produto",
              tags: ["Postmade", "SocialMedia", "Produtividade"],
            },
          ],
          scheduledFor: instant(26),
          publishedAt: null,
          createdAt: instant(-24),
          updatedAt: instant(-2),
        },
        {
          id: "development-publication:scheduled-instagram",
          createdBy: action.payload.userId,
          status: "scheduled",
          content: "Um novo jeito de organizar seu calendário de conteúdo.",
          media: [image],
          targets: [target(instagram, "scheduled")],
          tagGroupSnapshots: [],
          scheduledFor: instant(74),
          publishedAt: null,
          createdAt: instant(-12),
          updatedAt: instant(-1),
        },
        {
          id: "development-publication:published",
          createdBy: action.payload.userId,
          status: "published",
          content: "Centralize suas publicações e ganhe mais tempo para criar.",
          media: [image],
          targets: [
            target(instagram, "published", {
              externalUrl: "https://instagram.com/postmade",
            }),
            target(linkedin, "published", {
              externalUrl: "https://linkedin.com/company/postmade",
            }),
          ],
          tagGroupSnapshots: [],
          scheduledFor: instant(-25),
          publishedAt: instant(-24),
          createdAt: instant(-72),
          updatedAt: instant(-24),
        },
        {
          id: "development-publication:failed",
          createdBy: action.payload.userId,
          status: "failed",
          content:
            "Confira as novidades que preparamos para melhorar sua rotina.",
          media: [],
          targets: [
            target(facebook, "failed", {
              errorCode: "DEVELOPMENT_PROVIDER_ERROR",
            }),
          ],
          tagGroupSnapshots: [],
          scheduledFor: instant(-2),
          publishedAt: null,
          createdAt: instant(-26),
          updatedAt: instant(-2),
        }
      );
    },
    selectWorkspace: (
      state,
      action: PayloadAction<{ workspaceId: string; userId: string }>
    ) => {
      const allowed = state.items.some(
        (workspace) =>
          workspace.id === action.payload.workspaceId &&
          workspace.members.some(
            (member) => member.id === action.payload.userId
          )
      );
      if (allowed) state.activeWorkspaceId = action.payload.workspaceId;
    },
    activateAcceptedWorkspace: (
      state,
      action: PayloadAction<{ workspaceId: string }>
    ) => {
      state.activeWorkspaceId = action.payload.workspaceId;
    },
    renameWorkspace: (
      state,
      action: PayloadAction<{
        workspaceId: string;
        name: string;
        actorId: string;
      }>
    ) => {
      const workspace = state.items.find(
        (item) => item.id === action.payload.workspaceId
      );
      const actor = workspace?.members.find(
        (member) => member.id === action.payload.actorId
      );
      if (
        workspace &&
        actor &&
        (actor.role === "owner" || actor.role === "admin") &&
        action.payload.name.trim()
      ) {
        workspace.name = action.payload.name.trim();
      }
    },
    updateWorkspaceTimezone: (
      state,
      action: PayloadAction<{
        workspaceId: string;
        timezone: string;
        actorId: string;
      }>
    ) => {
      const workspace = state.items.find(
        (item) => item.id === action.payload.workspaceId
      );
      const actor = workspace?.members.find(
        (member) => member.id === action.payload.actorId
      );
      if (
        !workspace ||
        !actor ||
        (actor.role !== "owner" && actor.role !== "admin")
      )
        return;
      try {
        new Intl.DateTimeFormat("en", {
          timeZone: action.payload.timezone,
        }).format();
        workspace.timezone = action.payload.timezone;
      } catch {
        // Ignore values that are not valid IANA time zones.
      }
    },
    updateMemberIdentity: (
      state,
      action: PayloadAction<{ userId: string; name?: string; email?: string }>
    ) => {
      for (const workspace of state.items) {
        const member = workspace.members.find(
          (item) => item.id === action.payload.userId
        );
        if (!member) continue;
        if (action.payload.name) member.name = action.payload.name;
        if (action.payload.email)
          member.email = action.payload.email.toLowerCase();
      }
    },
    createWorkspacePublication: (
      state,
      action: PayloadAction<{
        workspaceId: string;
        actorId: string;
        publication: ScheduledPublication;
      }>
    ) => {
      const workspace = state.items.find(
        (item) => item.id === action.payload.workspaceId
      );
      const actor = workspace?.members.find(
        (member) => member.id === action.payload.actorId
      );
      if (!workspace || !actor || actor.role === "viewer") return;
      if (
        action.payload.publication.status !== "draft" &&
        workspace.subscriptionStatus === "trialing"
      ) {
        const used = workspace.resources.posts.filter(
          (post) => post.status !== "draft"
        ).length;
        if (used >= WORKSPACE_TRIAL_LIMITS.posts) return;
      }
      workspace.resources.posts.push(action.payload.publication);
    },
    updateWorkspacePublication: (
      state,
      action: PayloadAction<{
        workspaceId: string;
        actorId: string;
        publication: ScheduledPublication;
      }>
    ) => {
      const workspace = state.items.find(
        (item) => item.id === action.payload.workspaceId
      );
      const actor = workspace?.members.find(
        (member) => member.id === action.payload.actorId
      );
      const index =
        workspace?.resources.posts.findIndex(
          (post) => post.id === action.payload.publication.id
        ) ?? -1;
      if (!workspace || !actor || actor.role === "viewer" || index < 0) return;
      const current = workspace.resources.posts[index]!;
      if (current.status === "published" || current.status === "publishing")
        return;
      if (
        current.status === "draft" &&
        action.payload.publication.status !== "draft" &&
        workspace.subscriptionStatus === "trialing"
      ) {
        const used = workspace.resources.posts.filter(
          (post) => post.status !== "draft"
        ).length;
        if (used >= WORKSPACE_TRIAL_LIMITS.posts) return;
      }
      workspace.resources.posts[index] = action.payload.publication;
    },
    deleteWorkspacePublication: (
      state,
      action: PayloadAction<{
        workspaceId: string;
        publicationId: string;
        actorId: string;
      }>
    ) => {
      const workspace = state.items.find(
        (item) => item.id === action.payload.workspaceId
      );
      const actor = workspace?.members.find(
        (member) => member.id === action.payload.actorId
      );
      const publication = workspace?.resources.posts.find(
        (post) => post.id === action.payload.publicationId
      );
      if (
        !workspace ||
        !actor ||
        actor.role === "viewer" ||
        publication?.status === "published" ||
        publication?.status === "publishing"
      )
        return;
      workspace.resources.posts = workspace.resources.posts.filter(
        (post) => post.id !== action.payload.publicationId
      );
    },
    cancelWorkspacePublication: (
      state,
      action: PayloadAction<{
        workspaceId: string;
        publicationId: string;
        actorId: string;
      }>
    ) => {
      const workspace = state.items.find(
        (item) => item.id === action.payload.workspaceId
      );
      const actor = workspace?.members.find(
        (member) => member.id === action.payload.actorId
      );
      const publication = workspace?.resources.posts.find(
        (post) => post.id === action.payload.publicationId
      );
      if (
        !workspace ||
        !actor ||
        actor.role === "viewer" ||
        publication?.status !== "scheduled"
      )
        return;
      publication.status = "draft";
      publication.scheduledFor = null;
      publication.updatedAt = new Date().toISOString();
      publication.targets.forEach((target) => {
        target.status = "draft";
      });
    },
    duplicateWorkspacePublication: {
      reducer: (
        state,
        action: PayloadAction<{
          workspaceId: string;
          actorId: string;
          sourceId: string;
          id: string;
          now: string;
        }>
      ) => {
        const workspace = state.items.find(
          (item) => item.id === action.payload.workspaceId
        );
        const actor = workspace?.members.find(
          (member) => member.id === action.payload.actorId
        );
        const source = workspace?.resources.posts.find(
          (post) => post.id === action.payload.sourceId
        );
        if (!workspace || !actor || actor.role === "viewer" || !source) return;
        workspace.resources.posts.push({
          ...source,
          id: action.payload.id,
          status: "draft",
          scheduledFor: null,
          publishedAt: null,
          createdAt: action.payload.now,
          updatedAt: action.payload.now,
          targets: source.targets.map((target) => ({
            ...target,
            status: "draft",
            errorCode: null,
            externalUrl: null,
          })),
        });
      },
      prepare: (payload: {
        workspaceId: string;
        actorId: string;
        sourceId: string;
      }) => ({
        payload: { ...payload, id: nanoid(), now: new Date().toISOString() },
      }),
    },
    retryWorkspacePublication: (
      state,
      action: PayloadAction<{
        workspaceId: string;
        publicationId: string;
        actorId: string;
      }>
    ) => {
      const workspace = state.items.find(
        (item) => item.id === action.payload.workspaceId
      );
      const actor = workspace?.members.find(
        (member) => member.id === action.payload.actorId
      );
      const publication = workspace?.resources.posts.find(
        (post) => post.id === action.payload.publicationId
      );
      if (
        !workspace ||
        !actor ||
        actor.role === "viewer" ||
        publication?.status !== "failed"
      )
        return;
      publication.status = publication.scheduledFor
        ? "scheduled"
        : "publishing";
      publication.updatedAt = new Date().toISOString();
      publication.targets.forEach((target) => {
        target.status = publication.status;
        target.errorCode = null;
      });
    },
    clearWorkspaceSession: (state) => {
      state.items = [];
      state.activeWorkspaceId = null;
    },
    deleteAccountWorkspaces: (
      state,
      action: PayloadAction<{ userId: string; userEmail: string }>
    ) => {
      state.items = state.items
        .filter((workspace) => workspace.ownerId !== action.payload.userId)
        .map((workspace) => ({
          ...workspace,
          members: workspace.members.filter(
            (member) => member.id !== action.payload.userId
          ),
          invitations: workspace.invitations.filter(
            (invitation) =>
              invitation.email.toLowerCase() !==
              action.payload.userEmail.toLowerCase()
          ),
        }));

      const activeWorkspaceStillExists = state.items.some(
        (workspace) => workspace.id === state.activeWorkspaceId
      );
      state.activeWorkspaceId = activeWorkspaceStillExists
        ? state.activeWorkspaceId
        : null;
    },
  },
});

function prepareOwnedWorkspace(payload: {
  name: string;
  userId: string;
  userName: string;
  userEmail: string;
}) {
  return {
    ...payload,
    id: nanoid(),
    createdAt: new Date().toISOString(),
  };
}

export const {
  activateAcceptedWorkspace,
  clearWorkspaceSession,
  hydrateWorkspaces,
  createInitialWorkspace,
  createActiveWorkspaceMock,
  createPublicationsMock,
  createWorkspace,
  createWorkspacePublication,
  updateWorkspacePublication,
  deleteWorkspacePublication,
  cancelWorkspacePublication,
  duplicateWorkspacePublication,
  retryWorkspacePublication,
  deleteAccountWorkspaces,
  renameWorkspace,
  updateWorkspaceTimezone,
  selectWorkspace,
  updateMemberIdentity,
} = workspacesSlice.actions;

export default workspacesSlice.reducer;
