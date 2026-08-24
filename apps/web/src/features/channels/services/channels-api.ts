import type {
  ChannelsLookup,
  ChannelsPage,
  SocialPlatform,
  StartChannelOAuthOutput,
} from "@postmade/types";

import { api } from "@/shared/api/api";

export const channelsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getChannels: build.query<
      ChannelsPage,
      {
        workspaceId: string;
        page?: number;
        pageSize?: 10 | 25 | 50;
        query?: string;
        platform?: SocialPlatform;
      }
    >({
      query: ({ workspaceId, ...params }) => ({
        url: `/workspaces/${workspaceId}/channels`,
        params,
      }),
      providesTags: ["Channel"],
    }),
    lookupChannels: build.query<
      ChannelsLookup,
      {
        workspaceId: string;
        query?: string;
        limit?: number;
        includeIds?: string[];
      }
    >({
      query: ({ workspaceId, includeIds, ...params }) => ({
        url: `/workspaces/${workspaceId}/channels/lookup`,
        params: {
          ...params,
          ...(includeIds?.length ? { includeIds: includeIds.join(",") } : {}),
        },
      }),
      providesTags: ["Channel"],
    }),
    startChannelOAuth: build.mutation<
      StartChannelOAuthOutput,
      { workspaceId: string; platform: SocialPlatform }
    >({
      query: ({ workspaceId, platform }) => ({
        url: `/workspaces/${workspaceId}/channels/oauth/${platform}/start`,
        method: "POST",
      }),
    }),
    disconnectChannel: build.mutation<
      void,
      { workspaceId: string; channelId: string }
    >({
      query: ({ workspaceId, channelId }) => ({
        url: `/workspaces/${workspaceId}/channels/${channelId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Channel"],
    }),
  }),
});

export const {
  useDisconnectChannelMutation,
  useGetChannelsQuery,
  useLazyLookupChannelsQuery,
  useLookupChannelsQuery,
  useStartChannelOAuthMutation,
} = channelsApi;
