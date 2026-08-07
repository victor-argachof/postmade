import { api } from "@/shared/api/api";

export const billingApi = api.injectEndpoints({
  endpoints: (build) => ({
    createBillingPortalSession: build.mutation<
      { url: string },
      { workspaceId: string }
    >({
      query: ({ workspaceId }) => ({
        url: `/workspaces/${workspaceId}/billing-portal`,
        method: "POST",
      }),
    }),
    createCheckoutSession: build.mutation<
      { url: string },
      { workspaceId: string; channelQuantity: number; memberQuantity: number }
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/checkout`,
        method: "POST",
        body,
      }),
    }),
    updateSubscription: build.mutation<
      void,
      { workspaceId: string; channelQuantity: number; memberQuantity: number }
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/subscription`,
        method: "PATCH",
        body,
      }),
    }),
  }),
});

export const {
  useCreateBillingPortalSessionMutation,
  useCreateCheckoutSessionMutation,
  useUpdateSubscriptionMutation,
} = billingApi;
