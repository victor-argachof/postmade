import type {
  CreateTagGroupInput,
  TagGroup,
  TagGroupLookupQuery,
  TagGroupLookupResult,
  TagGroupsPage,
  TagGroupsQuery,
  UpdateTagGroupInput,
} from "@postmade/types";

import { api } from "@/shared/api/api";

function queryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") params.set(key, String(value));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const tagsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTagGroups: build.query<
      TagGroupsPage,
      { workspaceId: string } & TagGroupsQuery
    >({
      query: ({ workspaceId, ...query }) =>
        `/workspaces/${workspaceId}/tag-groups${queryString(query)}`,
      providesTags: (result) => [
        { type: "TagGroup", id: "LIST" },
        ...(result?.items.map(({ id }) => ({
          type: "TagGroup" as const,
          id,
        })) ?? []),
      ],
    }),
    lookupTagGroups: build.query<
      TagGroupLookupResult,
      { workspaceId: string } & TagGroupLookupQuery
    >({
      query: ({ workspaceId, includeIds, ...query }) =>
        `/workspaces/${workspaceId}/tag-groups/lookup${queryString({ ...query, includeIds: includeIds?.join(",") })}`,
      providesTags: (result) => [
        { type: "TagGroup", id: "LOOKUP" },
        ...(result?.options.map(({ id }) => ({
          type: "TagGroup" as const,
          id,
        })) ?? []),
      ],
    }),
    createTagGroup: build.mutation<
      TagGroup,
      { workspaceId: string } & CreateTagGroupInput
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/tag-groups`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "TagGroup", id: "LIST" },
        { type: "TagGroup", id: "LOOKUP" },
      ],
    }),
    updateTagGroup: build.mutation<
      TagGroup,
      { workspaceId: string; tagGroupId: string } & UpdateTagGroupInput
    >({
      query: ({ workspaceId, tagGroupId, ...body }) => ({
        url: `/workspaces/${workspaceId}/tag-groups/${tagGroupId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { tagGroupId }) => [
        { type: "TagGroup", id: tagGroupId },
        { type: "TagGroup", id: "LIST" },
        { type: "TagGroup", id: "LOOKUP" },
      ],
    }),
    deleteTagGroup: build.mutation<
      void,
      { workspaceId: string; tagGroupId: string }
    >({
      query: ({ workspaceId, tagGroupId }) => ({
        url: `/workspaces/${workspaceId}/tag-groups/${tagGroupId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { tagGroupId }) => [
        { type: "TagGroup", id: tagGroupId },
        { type: "TagGroup", id: "LIST" },
        { type: "TagGroup", id: "LOOKUP" },
      ],
    }),
  }),
});

export const {
  useGetTagGroupsQuery,
  useLazyLookupTagGroupsQuery,
  useCreateTagGroupMutation,
  useUpdateTagGroupMutation,
  useDeleteTagGroupMutation,
} = tagsApi;
