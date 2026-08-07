import type { ScheduledPublication } from "@postmade/types";

import { api } from "@/shared/api/api";

interface PublicationListInput {
  workspaceId: string;
  status?: string;
  channelId?: string;
  query?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
interface PublicationListOutput {
  items: ScheduledPublication[];
  total: number;
}
interface PublicationMutationInput {
  workspaceId: string;
  publication: ScheduledPublication;
}

export const postsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPublications: build.query<PublicationListOutput, PublicationListInput>({
      query: ({ workspaceId, ...params }) => ({
        url: `/workspaces/${workspaceId}/publications`,
        params,
      }),
      providesTags: ["Post"],
    }),
    createPublication: build.mutation<
      ScheduledPublication,
      PublicationMutationInput
    >({
      query: ({ workspaceId, publication }) => ({
        url: `/workspaces/${workspaceId}/publications`,
        method: "POST",
        body: publication,
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
    updatePublication: build.mutation<
      ScheduledPublication,
      PublicationMutationInput
    >({
      query: ({ workspaceId, publication }) => ({
        url: `/workspaces/${workspaceId}/publications/${publication.id}`,
        method: "PATCH",
        body: publication,
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
    deletePublication: build.mutation<
      void,
      { workspaceId: string; publicationId: string }
    >({
      query: ({ workspaceId, publicationId }) => ({
        url: `/workspaces/${workspaceId}/publications/${publicationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
    duplicatePublication: build.mutation<
      ScheduledPublication,
      { workspaceId: string; publicationId: string }
    >({
      query: ({ workspaceId, publicationId }) => ({
        url: `/workspaces/${workspaceId}/publications/${publicationId}/duplicate`,
        method: "POST",
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
    retryPublication: build.mutation<
      ScheduledPublication,
      { workspaceId: string; publicationId: string }
    >({
      query: ({ workspaceId, publicationId }) => ({
        url: `/workspaces/${workspaceId}/publications/${publicationId}/retry`,
        method: "POST",
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
    uploadPublicationMedia: build.mutation<
      { url: string },
      { workspaceId: string; body: FormData }
    >({
      query: ({ workspaceId, body }) => ({
        url: `/workspaces/${workspaceId}/media`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetPublicationsQuery,
  useCreatePublicationMutation,
  useUpdatePublicationMutation,
  useDeletePublicationMutation,
  useDuplicatePublicationMutation,
  useRetryPublicationMutation,
  useUploadPublicationMediaMutation,
} = postsApi;
