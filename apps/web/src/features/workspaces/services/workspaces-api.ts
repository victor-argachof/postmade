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
export const { useGetWorkspacesQuery, useUpdateWorkspaceMutation } =
  workspacesApi;
