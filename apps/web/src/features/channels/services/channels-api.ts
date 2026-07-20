import type { SocialChannel, SocialPlatform } from "@postmade/types";
import { api } from "@/shared/api/api";

export const channelsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getChannels: build.query<SocialChannel[], void>({ query: () => "/channels", providesTags: ["Channel"] }),
    getOAuthUrl: build.mutation<{ url: string }, SocialPlatform>({ query: (platform) => ({ url: `/channels/${platform}/oauth`, method: "POST" }) }),
  }),
});

export const { useGetChannelsQuery, useGetOAuthUrlMutation } = channelsApi;
