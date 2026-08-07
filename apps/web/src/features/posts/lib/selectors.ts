import type { ScheduledPublication } from "@postmade/types";

import type { RootState } from "@/shared/store";

import type { PublicationFilters } from "../types";

export const selectActiveWorkspace = (state: RootState) =>
  state.workspaces.items.find(
    (item) => item.id === state.workspaces.activeWorkspaceId
  );
export const selectActivePublications = (state: RootState) =>
  selectActiveWorkspace(state)?.resources.posts ?? [];
export const selectPublicationById = (state: RootState, id: string) =>
  selectActivePublications(state).find((post) => post.id === id);
export const selectTrialPublicationUsage = (state: RootState) =>
  selectActivePublications(state).filter((post) => post.status !== "draft")
    .length;

export function filterPublications(
  publications: ScheduledPublication[],
  filters: PublicationFilters
) {
  const query = filters.query.trim().toLowerCase();
  return publications.filter((post) => {
    const date = post.scheduledFor ?? post.publishedAt ?? post.createdAt;
    return (
      (!query || post.content.toLowerCase().includes(query)) &&
      (filters.status === "all" || post.status === filters.status) &&
      (filters.platform === "all" ||
        post.targets.some((target) => target.platform === filters.platform)) &&
      (filters.channelId === "all" ||
        post.targets.some(
          (target) => target.channelId === filters.channelId
        )) &&
      (!filters.from ||
        date >= new Date(`${filters.from}T00:00:00`).toISOString()) &&
      (!filters.to || date <= new Date(`${filters.to}T23:59:59`).toISOString())
    );
  });
}

export function groupPublicationsByLocalDay(
  publications: ScheduledPublication[],
  timezone: string
) {
  return publications.reduce<Record<string, ScheduledPublication[]>>(
    (groups, post) => {
      const instant = post.scheduledFor ?? post.publishedAt;
      if (!instant || post.status === "draft") return groups;
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date(instant));
      const value = (type: string) =>
        parts.find((part) => part.type === type)?.value;
      const key = `${value("year")}-${value("month")}-${value("day")}`;
      (groups[key] ??= []).push(post);
      return groups;
    },
    {}
  );
}
