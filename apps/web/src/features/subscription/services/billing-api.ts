import { api } from "@/shared/api/api";
import type { BillingCycle, WorkspacePlan } from "@/features/workspaces/store/workspaces-slice";

export const billingApi = api.injectEndpoints({
  endpoints: (build) => ({
    createBillingPortalSession: build.mutation<{ url: string }, { workspaceId: string }>({
      query: ({ workspaceId }) => ({
        url: `/workspaces/${workspaceId}/billing-portal`,
        method: "POST",
      }),
    }),
    createCheckoutSession: build.mutation<
      { url: string },
      { workspaceId: string; plan: WorkspacePlan; billingCycle: BillingCycle }
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/checkout`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useCreateBillingPortalSessionMutation,
  useCreateCheckoutSessionMutation,
} = billingApi;
