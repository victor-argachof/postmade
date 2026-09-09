import type { ScheduledPublication } from "@postmade/types";

import { filterPublications, groupPublicationsByLocalDay } from "../selectors";

const post: ScheduledPublication = {
  id: "post-1",
  createdBy: "user-1",
  title: null,
  status: "scheduled",
  content: "Launch day",
  media: [],
  scheduledFor: "2026-08-08T01:30:00.000Z",
  publishedAt: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  targets: [
    {
      channelId: "channel-1",
      platform: "linkedin",
      contentOverride: null,
      mediaOverride: null,
      settings: {},
      status: "scheduled",
      errorCode: null,
      externalUrl: null,
    },
  ],
};

describe("publication selectors", () => {
  it("filters by content, status, platform and channel", () => {
    expect(
      filterPublications([post], {
        query: "launch",
        status: "scheduled",
        platform: "linkedin",
        channelId: "channel-1",
        from: "",
        to: "",
      })
    ).toEqual([post]);
    expect(
      filterPublications([post], {
        query: "missing",
        status: "all",
        platform: "all",
        channelId: "all",
        from: "",
        to: "",
      })
    ).toEqual([]);
  });

  it("filters by the internal title", () => {
    expect(
      filterPublications([{ ...post, title: "Campanha Primavera" }], {
        query: "primavera",
        status: "all",
        platform: "all",
        channelId: "all",
        from: "",
        to: "",
      })
    ).toHaveLength(1);
  });

  it("groups instants by workspace timezone", () => {
    expect(
      groupPublicationsByLocalDay([post], "America/Sao_Paulo")["2026-08-07"]
    ).toEqual([post]);
  });
});
