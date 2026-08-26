import type { ScheduledPublication } from "@postmade/types";

import type { Workspace } from "@/features/workspaces/types";

export interface DashboardSummary {
  connectedChannels: number;
  drafts: number;
  scheduled: number;
  failed: number;
}

export function getDashboardSummary(
  workspace?: Workspace,
  connectedChannels = 0,
  remote?: Pick<DashboardSummary, "drafts" | "scheduled" | "failed">
): DashboardSummary {
  const posts = workspace?.resources.posts ?? [];
  return {
    connectedChannels,
    drafts:
      remote?.drafts ?? posts.filter((post) => post.status === "draft").length,
    scheduled:
      remote?.scheduled ??
      posts.filter((post) => post.status === "scheduled").length,
    failed:
      remote?.failed ?? posts.filter((post) => post.status === "failed").length,
  };
}

export function getUpcomingPublications(
  workspaceOrPublications?: Workspace | ScheduledPublication[],
  now = Date.now()
): ScheduledPublication[] {
  const publications = Array.isArray(workspaceOrPublications)
    ? workspaceOrPublications
    : (workspaceOrPublications?.resources.posts ?? []);
  return publications
    .filter(
      (post) =>
        post.status === "scheduled" &&
        post.scheduledFor !== null &&
        new Date(post.scheduledFor).getTime() > now
    )
    .sort((first, second) =>
      first.scheduledFor!.localeCompare(second.scheduledFor!)
    )
    .slice(0, 5);
}

export function getLocalDateKey(iso: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
