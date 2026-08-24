export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";
export type AssignableWorkspaceRole = Exclude<WorkspaceRole, "owner">;
export type WorkspaceInvitationStatus =
  "pending" | "accepted" | "revoked" | "expired";

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  email: string;
  role: AssignableWorkspaceRole;
  status: WorkspaceInvitationStatus;
  invitedBy: { id: string; name: string };
  invitedAt: string;
  expiresAt: string;
  invitationUrl?: string;
}

export interface WorkspaceInvitationDetails {
  workspaceName: string;
  email: string;
  role: AssignableWorkspaceRole;
  invitedByName: string;
  expiresAt: string;
  status: WorkspaceInvitationStatus;
}
