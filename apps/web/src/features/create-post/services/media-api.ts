import type {
  CreateMediaUploadInput,
  MediaAccessResponse,
  MediaUploadResponse,
  PublicationMedia,
} from "@postmade/types";

import { api } from "@/shared/api/api";

export const mediaApi = api.injectEndpoints({
  endpoints: (build) => ({
    createMediaUpload: build.mutation<
      MediaUploadResponse,
      { workspaceId: string; input: CreateMediaUploadInput }
    >({
      query: ({ workspaceId, input }) => ({
        url: `/workspaces/${workspaceId}/media/uploads`,
        method: "POST",
        body: input,
      }),
    }),
    completeMediaUpload: build.mutation<
      PublicationMedia,
      { workspaceId: string; mediaId: string }
    >({
      query: ({ workspaceId, mediaId }) => ({
        url: `/workspaces/${workspaceId}/media/${mediaId}/complete`,
        method: "POST",
      }),
    }),
    getMediaAccess: build.query<
      MediaAccessResponse,
      { workspaceId: string; mediaId: string }
    >({
      query: ({ workspaceId, mediaId }) =>
        `/workspaces/${workspaceId}/media/${mediaId}/access`,
    }),
    deleteMedia: build.mutation<void, { workspaceId: string; mediaId: string }>(
      {
        query: ({ workspaceId, mediaId }) => ({
          url: `/workspaces/${workspaceId}/media/${mediaId}`,
          method: "DELETE",
        }),
      }
    ),
  }),
});

export const {
  useCreateMediaUploadMutation,
  useCompleteMediaUploadMutation,
  useLazyGetMediaAccessQuery,
  useDeleteMediaMutation,
} = mediaApi;
