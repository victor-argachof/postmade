import type { ScheduledPublication } from "@postmade/types";

import { api } from "@/shared/api/api";

export const calendarApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSchedule: build.query<
      ScheduledPublication[],
      { workspaceId: string; from: string; to: string }
    >({
      query: ({ workspaceId, ...params }) => ({
        url: `/workspaces/${workspaceId}/publications`,
        params,
      }),
      providesTags: ["Schedule"],
    }),
  }),
});

export const { useGetScheduleQuery } = calendarApi;
