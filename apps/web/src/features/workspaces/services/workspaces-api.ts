import type {
  AssignableWorkspaceRole,
  WorkspaceInvitation,
  WorkspaceInvitationDetails,
  WorkspaceMember,
} from "@postmade/types";

import { api } from "@/shared/api/api";

import type {
  SubscriptionStatus,
  WorkspaceSubscriptionConfiguration,
} from "../types/billing";
import type { WorkspaceRole } from "../types/workspace";

export interface ApiWorkspace {
  id: string;
  name: string;
  ownerId: string;
  timezone: string;
  role: WorkspaceRole;
  subscriptionStatus: SubscriptionStatus;
  subscriptionConfiguration: WorkspaceSubscriptionConfiguration;
  trialStartedAt: string;
  trialEndsAt: string;
  createdAt: string;
}
export const workspacesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getWorkspaces: build.query<ApiWorkspace[], void>({
      query: () => "/workspaces",
      providesTags: ["Workspace"],
    }),
    getWorkspaceMembers: build.query<WorkspaceMember[], string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/members`,
      providesTags: (_result, _error, id) => [{ type: "WorkspaceMember", id }],
    }),
    getWorkspaceInvitations: build.query<WorkspaceInvitation[], string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/invitations`,
      providesTags: (_result, _error, id) => [
        { type: "WorkspaceInvitation", id },
      ],
    }),
    createWorkspaceInvitation: build.mutation<
      WorkspaceInvitation,
      { workspaceId: string; email: string; role: AssignableWorkspaceRole }
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/invitations`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, input) => [
        { type: "WorkspaceInvitation", id: input.workspaceId },
      ],
    }),
    resendWorkspaceInvitation: build.mutation<
      WorkspaceInvitation,
      { workspaceId: string; invitationId: string }
    >({
      query: ({ workspaceId, invitationId }) => ({
        url: `/workspaces/${workspaceId}/invitations/${invitationId}/resend`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, input) => [
        { type: "WorkspaceInvitation", id: input.workspaceId },
      ],
    }),
    revokeWorkspaceInvitation: build.mutation<
      void,
      { workspaceId: string; invitationId: string }
    >({
      query: ({ workspaceId, invitationId }) => ({
        url: `/workspaces/${workspaceId}/invitations/${invitationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, input) => [
        { type: "WorkspaceInvitation", id: input.workspaceId },
      ],
    }),
    updateWorkspaceMember: build.mutation<
      WorkspaceMember[],
      { workspaceId: string; memberId: string; role: AssignableWorkspaceRole }
    >({
      query: ({ workspaceId, memberId, role }) => ({
        url: `/workspaces/${workspaceId}/members/${memberId}`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (_result, _error, input) => [
        { type: "WorkspaceMember", id: input.workspaceId },
      ],
    }),
    removeWorkspaceMember: build.mutation<
      void,
      { workspaceId: string; memberId: string }
    >({
      query: ({ workspaceId, memberId }) => ({
        url: `/workspaces/${workspaceId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, input) => [
        { type: "WorkspaceMember", id: input.workspaceId },
      ],
    }),
    getInvitationDetails: build.query<WorkspaceInvitationDetails, string>({
      query: (token) => `/workspace-invitations/${encodeURIComponent(token)}`,
    }),
    acceptWorkspaceInvitation: build.mutation<{ workspaceId: string }, string>({
      query: (token) => ({
        url: `/workspace-invitations/${encodeURIComponent(token)}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["Workspace"],
    }),
    updateWorkspace: build.mutation<
      ApiWorkspace,
      { workspaceId: string; name?: string; timezone?: string }
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}`,
        method: "PATCH",
        body,
      }),
    }),
  }),
});
export const {
  useGetWorkspacesQuery,
  useUpdateWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useGetWorkspaceInvitationsQuery,
  useCreateWorkspaceInvitationMutation,
  useResendWorkspaceInvitationMutation,
  useRevokeWorkspaceInvitationMutation,
  useUpdateWorkspaceMemberMutation,
  useRemoveWorkspaceMemberMutation,
  useGetInvitationDetailsQuery,
  useAcceptWorkspaceInvitationMutation,
} = workspacesApi;
