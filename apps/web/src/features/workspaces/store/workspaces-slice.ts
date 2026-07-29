import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type { ScheduledPublication, SocialChannel } from "@postmade/types";

export type WorkspacePlan = "creator" | "growth" | "pro";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";
export type BillingCycle = "monthly" | "annual";
export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";
export type InvitationStatus = "pending" | "accepted" | "revoked";

export interface WorkspaceBilling {
  cycle: BillingCycle | null;
  currentPeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  currency: string | null;
  nextInvoiceAmount: number | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  token: string;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  status: InvitationStatus;
  invitedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  plan: WorkspacePlan;
  subscriptionStatus: SubscriptionStatus;
  trialStartedAt: string;
  trialEndsAt: string;
  billing?: WorkspaceBilling;
  createdAt: string;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  resources: {
    channels: SocialChannel[];
    posts: ScheduledPublication[];
    selectedCalendarDate: string | null;
  };
}

export const WORKSPACE_PLAN_LIMITS: Record<WorkspacePlan, number> = {
  creator: 1,
  growth: 5,
  pro: 15,
};

export const WORKSPACE_PLAN_CHANNEL_LIMITS: Record<WorkspacePlan, number | null> = {
  creator: 15,
  growth: 50,
  pro: null,
};

export const WORKSPACE_TRIAL_LIMITS = {
  days: 15,
  posts: 3,
  channels: 3,
} as const;

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
    plan: "creator",
    subscriptionStatus: "trialing",
    trialStartedAt: payload.createdAt,
    trialEndsAt: trialEnd(payload.createdAt),
    createdAt: payload.createdAt,
    members: [{
      id: payload.userId,
      name: payload.userName,
      email: payload.userEmail.toLowerCase(),
      role: "owner",
      joinedAt: payload.createdAt,
    }],
    invitations: [],
    resources: {
      channels: [],
      posts: [],
      selectedCalendarDate: null,
    },
  };
}

const workspacesSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {
    createInitialWorkspace: {
      reducer: (state, action: PayloadAction<ReturnType<typeof prepareOwnedWorkspace>>) => {
        const existingWorkspace = state.items.find((workspace) =>
          workspace.members.some((member) => member.id === action.payload.userId),
        );
        if (existingWorkspace) {
          state.activeWorkspaceId = existingWorkspace.id;
          return;
        }
        const workspace = createOwnedWorkspace(action.payload);
        state.items.push(workspace);
        state.activeWorkspaceId = workspace.id;
      },
      prepare: (payload: { userId: string; userName: string; userEmail: string }) => ({
        payload: prepareOwnedWorkspace({
          ...payload,
          name: `Workspace de ${payload.userName.trim()}`,
        }),
      }),
    },
    createWorkspace: {
      reducer: (state, action: PayloadAction<ReturnType<typeof prepareOwnedWorkspace>>) => {
        const workspace = createOwnedWorkspace(action.payload);
        state.items.push(workspace);
        state.activeWorkspaceId = workspace.id;
      },
      prepare: (payload: { name: string; userId: string; userName: string; userEmail: string }) => ({
        payload: prepareOwnedWorkspace(payload),
      }),
    },
    selectWorkspace: (state, action: PayloadAction<{ workspaceId: string; userId: string }>) => {
      const allowed = state.items.some((workspace) =>
        workspace.id === action.payload.workspaceId
        && workspace.members.some((member) => member.id === action.payload.userId),
      );
      if (allowed) state.activeWorkspaceId = action.payload.workspaceId;
    },
    renameWorkspace: (state, action: PayloadAction<{ workspaceId: string; name: string; actorId: string }>) => {
      const workspace = state.items.find((item) => item.id === action.payload.workspaceId);
      const actor = workspace?.members.find((member) => member.id === action.payload.actorId);
      if (workspace && actor && (actor.role === "owner" || actor.role === "admin") && action.payload.name.trim()) {
        workspace.name = action.payload.name.trim();
      }
    },
    inviteMember: {
      reducer: (state, action: PayloadAction<{
        workspaceId: string;
        actorId: string;
        invitation: WorkspaceInvitation;
      }>) => {
        const workspace = state.items.find((item) => item.id === action.payload.workspaceId);
        const actor = workspace?.members.find((member) => member.id === action.payload.actorId);
        if (!workspace || !actor || (actor.role !== "owner" && actor.role !== "admin")) return;
        if (workspace.plan === "creator") return;
        const occupiedSeats = workspace.members.length + workspace.invitations.filter((invite) => invite.status === "pending").length;
        if (occupiedSeats >= WORKSPACE_PLAN_LIMITS[workspace.plan]) return;
        const email = action.payload.invitation.email.toLowerCase();
        const duplicate = workspace.members.some((member) => member.email === email)
          || workspace.invitations.some((invite) => invite.email === email && invite.status === "pending");
        if (!duplicate) workspace.invitations.push({ ...action.payload.invitation, email });
      },
      prepare: (payload: {
        workspaceId: string;
        actorId: string;
        email: string;
        role: Exclude<WorkspaceRole, "owner">;
      }) => ({
        payload: {
          workspaceId: payload.workspaceId,
          actorId: payload.actorId,
          invitation: {
            id: nanoid(),
            token: nanoid(32),
            email: payload.email.trim().toLowerCase(),
            role: payload.role,
            status: "pending" as const,
            invitedAt: new Date().toISOString(),
          },
        },
      }),
    },
    revokeInvitation: (state, action: PayloadAction<{ workspaceId: string; invitationId: string; actorId: string }>) => {
      const workspace = state.items.find((item) => item.id === action.payload.workspaceId);
      const actor = workspace?.members.find((member) => member.id === action.payload.actorId);
      const invitation = workspace?.invitations.find((item) => item.id === action.payload.invitationId);
      if (invitation && actor && (actor.role === "owner" || actor.role === "admin")) invitation.status = "revoked";
    },
    acceptInvitation: (state, action: PayloadAction<{
      token: string;
      userId: string;
      userName: string;
      userEmail: string;
      acceptedAt: string;
    }>) => {
      const workspace = state.items.find((item) =>
        item.invitations.some((invitation) => invitation.token === action.payload.token),
      );
      const invitation = workspace?.invitations.find((item) => item.token === action.payload.token);
      if (!workspace || !invitation || invitation.status !== "pending") return;
      if (invitation.email !== action.payload.userEmail.toLowerCase()) return;
      if (workspace.members.length >= WORKSPACE_PLAN_LIMITS[workspace.plan]) return;
      if (!workspace.members.some((member) => member.id === action.payload.userId)) {
        workspace.members.push({
          id: action.payload.userId,
          name: action.payload.userName,
          email: action.payload.userEmail.toLowerCase(),
          role: invitation.role,
          joinedAt: action.payload.acceptedAt,
        });
      }
      invitation.status = "accepted";
      state.activeWorkspaceId = workspace.id;
    },
    changeMemberRole: (state, action: PayloadAction<{
      workspaceId: string;
      memberId: string;
      role: Exclude<WorkspaceRole, "owner">;
      actorId: string;
    }>) => {
      const workspace = state.items.find((item) => item.id === action.payload.workspaceId);
      const actor = workspace?.members.find((member) => member.id === action.payload.actorId);
      const member = workspace?.members.find((item) => item.id === action.payload.memberId);
      if (member && member.role !== "owner" && actor && (actor.role === "owner" || actor.role === "admin")) {
        member.role = action.payload.role;
      }
    },
    removeMember: (state, action: PayloadAction<{ workspaceId: string; memberId: string; actorId: string }>) => {
      const workspace = state.items.find((item) => item.id === action.payload.workspaceId);
      const actor = workspace?.members.find((member) => member.id === action.payload.actorId);
      const target = workspace?.members.find((member) => member.id === action.payload.memberId);
      if (workspace && target?.role !== "owner" && actor && (actor.role === "owner" || actor.role === "admin")) {
        workspace.members = workspace.members.filter((member) => member.id !== action.payload.memberId);
      }
    },
    setWorkspacePlan: (state, action: PayloadAction<{ workspaceId: string; plan: WorkspacePlan; actorId: string }>) => {
      const workspace = state.items.find((item) => item.id === action.payload.workspaceId);
      if (workspace?.ownerId !== action.payload.actorId) return;
      const occupiedSeats = workspace.members.length
        + workspace.invitations.filter((invitation) => invitation.status === "pending").length;
      if (action.payload.plan === "creator" && occupiedSeats > 1) return;
      workspace.plan = action.payload.plan;
    },
    updateMemberIdentity: (state, action: PayloadAction<{ userId: string; name?: string; email?: string }>) => {
      for (const workspace of state.items) {
        const member = workspace.members.find((item) => item.id === action.payload.userId);
        if (!member) continue;
        if (action.payload.name) member.name = action.payload.name;
        if (action.payload.email) member.email = action.payload.email.toLowerCase();
      }
    },
    clearWorkspaceSession: (state) => {
      state.activeWorkspaceId = null;
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
  acceptInvitation,
  changeMemberRole,
  clearWorkspaceSession,
  createInitialWorkspace,
  createWorkspace,
  inviteMember,
  removeMember,
  renameWorkspace,
  revokeInvitation,
  selectWorkspace,
  setWorkspacePlan,
  updateMemberIdentity,
} = workspacesSlice.actions;

export default workspacesSlice.reducer;
