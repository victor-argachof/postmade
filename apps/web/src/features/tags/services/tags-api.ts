import type { TagGroup } from "@postmade/types";

import { api } from "@/shared/api/api";

export const tagsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTagGroups: build.query<TagGroup[], { workspaceId: string }>({
      query: ({ workspaceId }) => `/workspaces/${workspaceId}/tag-groups`,
    }),
    createTagGroup: build.mutation<
      TagGroup,
      { workspaceId: string; name: string; tags: string[] }
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/tag-groups`,
        method: "POST",
        body,
      }),
    }),
    updateTagGroup: build.mutation<
      TagGroup,
      { workspaceId: string; tagGroupId: string; name: string; tags: string[] }
    >({
      query: ({ workspaceId, tagGroupId, ...body }) => ({
        url: `/workspaces/${workspaceId}/tag-groups/${tagGroupId}`,
        method: "PATCH",
        body,
      }),
    }),
    deleteTagGroup: build.mutation<
      void,
      { workspaceId: string; tagGroupId: string }
    >({
      query: ({ workspaceId, tagGroupId }) => ({
        url: `/workspaces/${workspaceId}/tag-groups/${tagGroupId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetTagGroupsQuery,
  useCreateTagGroupMutation,
  useUpdateTagGroupMutation,
  useDeleteTagGroupMutation,
} = tagsApi;
