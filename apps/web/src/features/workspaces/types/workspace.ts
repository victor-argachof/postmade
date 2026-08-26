import type {
  SubscriptionStatus,
  WorkspaceBilling,
  WorkspaceSubscriptionConfiguration,
} from "./billing";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export type InvitationStatus = "pending" | "accepted" | "revoked";

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
  role: WorkspaceRole;
  subscriptionConfiguration: WorkspaceSubscriptionConfiguration;
  subscriptionStatus: SubscriptionStatus;
  trialStartedAt: string;
  trialEndsAt: string;
  billing?: WorkspaceBilling;
  createdAt: string;
  timezone: string;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  /** @deprecated Remote publications are stored in the RTK Query cache. */
  resources: {
    posts: import("@postmade/types").ScheduledPublication[];
    selectedCalendarDate: string | null;
  };
}
