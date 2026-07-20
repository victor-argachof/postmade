import type { ScheduledPublication } from "@postmade/types";
import { api } from "@/shared/api/api";

export const postsApi = api.injectEndpoints({
  endpoints: (build) => ({
    createPost: build.mutation<ScheduledPublication, FormData>({
      query: (body) => ({ url: "/posts", method: "POST", body }),
      invalidatesTags: ["Post", "Schedule"],
    }),
  }),
});

export const { useCreatePostMutation } = postsApi;
