import type { SocialChannel, SocialPlatform } from "@postmade/types";

import { api } from "@/shared/api/api";

export const channelsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getChannels: build.query<SocialChannel[], { workspaceId: string }>({
      query: ({ workspaceId }) => `/workspaces/${workspaceId}/channels`,
      providesTags: ["Channel"],
    }),
    getOAuthUrl: build.mutation<
      { url: string },
      { workspaceId: string; platform: SocialPlatform }
    >({
      query: ({ workspaceId, platform }) => ({
        url: `/workspaces/${workspaceId}/channels/${platform}/oauth`,
        method: "POST",
        body: { workspaceId, platform },
      }),
    }),
  }),
});

export const { useGetChannelsQuery, useGetOAuthUrlMutation } = channelsApi;
