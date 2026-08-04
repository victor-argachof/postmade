import { api } from "@/shared/api/api";
import type { BillingCycle } from "@/features/workspaces/types";

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
      { workspaceId: string; billingCycle: BillingCycle; channelQuantity: number; memberQuantity: number }
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
