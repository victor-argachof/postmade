import type {
  PublicationFiltersInput,
  PublicationInput,
  PublicationsPage,
  ScheduledPublication,
} from "@postmade/types";

import { api } from "@/shared/api/api";

type WorkspaceInput = { workspaceId: string };
export const postsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPublications: build.query<
      PublicationsPage,
      WorkspaceInput & PublicationFiltersInput
    >({
      query: ({ workspaceId, ...params }) => ({
        url: `/workspaces/${workspaceId}/publications`,
        params,
      }),
      providesTags: ["Post", "Schedule"],
    }),
    getPublication: build.query<
      ScheduledPublication,
      WorkspaceInput & { publicationId: string }
    >({
      query: ({ workspaceId, publicationId }) =>
        `/workspaces/${workspaceId}/publications/${publicationId}`,
      providesTags: (_r, _e, input) => [
        { type: "Post", id: input.publicationId },
      ],
    }),
    createPublication: build.mutation<
      ScheduledPublication,
      WorkspaceInput & { publication: PublicationInput }
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
      WorkspaceInput & { publicationId: string; publication: PublicationInput }
    >({
      query: ({ workspaceId, publicationId, publication }) => ({
        url: `/workspaces/${workspaceId}/publications/${publicationId}`,
        method: "PATCH",
        body: publication,
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
    updatePublicationTitle: build.mutation<
      ScheduledPublication,
      WorkspaceInput & { publicationId: string; title: string | null }
    >({
      query: ({ workspaceId, publicationId, title }) => ({
        url: `/workspaces/${workspaceId}/publications/${publicationId}/title`,
        method: "PATCH",
        body: { title },
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
    deletePublication: build.mutation<
      void,
      WorkspaceInput & { publicationId: string }
    >({
      query: ({ workspaceId, publicationId }) => ({
        url: `/workspaces/${workspaceId}/publications/${publicationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
    duplicatePublication: build.mutation<
      ScheduledPublication,
      WorkspaceInput & { publicationId: string }
    >({
      query: ({ workspaceId, publicationId }) => ({
        url: `/workspaces/${workspaceId}/publications/${publicationId}/duplicate`,
        method: "POST",
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
    cancelPublication: build.mutation<
      ScheduledPublication,
      WorkspaceInput & { publicationId: string }
    >({
      query: ({ workspaceId, publicationId }) => ({
        url: `/workspaces/${workspaceId}/publications/${publicationId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
    retryPublication: build.mutation<
      ScheduledPublication,
      WorkspaceInput & { publicationId: string }
    >({
      query: ({ workspaceId, publicationId }) => ({
        url: `/workspaces/${workspaceId}/publications/${publicationId}/retry`,
        method: "POST",
      }),
      invalidatesTags: ["Post", "Schedule"],
    }),
  }),
});

export const {
  useGetPublicationsQuery,
  useGetPublicationQuery,
  useCreatePublicationMutation,
  useUpdatePublicationMutation,
  useUpdatePublicationTitleMutation,
  useDeletePublicationMutation,
  useDuplicatePublicationMutation,
  useCancelPublicationMutation,
  useRetryPublicationMutation,
} = postsApi;
