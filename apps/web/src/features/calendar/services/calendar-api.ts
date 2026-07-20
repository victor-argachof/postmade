import type { ScheduledPublication } from "@postmade/types";
import { api } from "@/shared/api/api";

export const calendarApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSchedule: build.query<ScheduledPublication[], { from: string; to: string }>({
      query: (params) => ({ url: "/schedule", params }),
      providesTags: ["Schedule"],
    }),
  }),
});

export const { useGetScheduleQuery } = calendarApi;
