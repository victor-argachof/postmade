import type { ScheduledPublication } from "@postmade/types";

import type { Workspace } from "@/features/workspaces/types";

import {
  getDashboardSummary,
  getLocalDateKey,
  getUpcomingPublications,
} from "../selectors";

const post = (
  id: string,
  status: ScheduledPublication["status"],
  scheduledFor: string | null
): ScheduledPublication => ({
  id,
  createdBy: "user-1",
  title: null,
  status,
  content: id,
  media: [],
  targets: [],
  scheduledFor,
  publishedAt: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
});

const workspace = {
  resources: {
    posts: [
      post("draft", "draft", null),
      post("scheduled-2", "scheduled", "2026-08-16T12:00:00.000Z"),
      post("scheduled-1", "scheduled", "2026-08-15T12:00:00.000Z"),
      post("failed", "failed", "2026-08-13T12:00:00.000Z"),
    ],
  },
} as Workspace;

describe("dashboard selectors", () => {
  it("derives the operational summary from the workspace", () => {
    expect(getDashboardSummary(workspace, 1)).toEqual({
      connectedChannels: 1,
      drafts: 1,
      scheduled: 2,
      failed: 1,
    });
  });

  it("returns only future schedules ordered and limited to five", () => {
    const workspaceWithManySchedules = {
      ...workspace,
      resources: {
        ...workspace.resources,
        posts: Array.from({ length: 6 }, (_, index) =>
          post(
            `scheduled-${index + 1}`,
            "scheduled",
            `2026-08-${String(15 + index).padStart(2, "0")}T12:00:00.000Z`
          )
        ),
      },
    } as Workspace;
    const result = getUpcomingPublications(
      workspaceWithManySchedules,
      new Date("2026-08-14T00:00:00.000Z").getTime()
    );
    expect(result.map((item) => item.id)).toEqual([
      "scheduled-1",
      "scheduled-2",
      "scheduled-3",
      "scheduled-4",
      "scheduled-5",
    ]);
  });

  it("creates calendar date keys in the workspace timezone", () => {
    expect(
      getLocalDateKey("2026-08-15T01:00:00.000Z", "America/Sao_Paulo")
    ).toBe("2026-08-14");
  });
});
