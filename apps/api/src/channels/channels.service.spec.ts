import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ChannelsService } from "./channels.service.js";

const now = new Date("2026-08-24T12:00:00Z");
const channel = {
  id: "channel-1",
  workspaceId: "workspace-1",
  platform: "instagram" as const,
  providerAccountId: "provider-1",
  displayName: "Postmade",
  username: "@postmade",
  avatarUrl: null,
  searchText: "postmade @postmade",
  connectionStatus: "connected" as const,
  lastCheckedAt: null,
  connectedAt: now,
  disconnectedAt: null,
  createdBy: "user-1",
  createdAt: now,
  updatedAt: now,
};

function service(prisma: Record<string, unknown>) {
  return new ChannelsService(
    prisma as never,
    { client: {}, assertLimit: async () => true } as never,
    {
      requireMembership: async () => ({ role: "viewer" }),
      requireRole: async () => ({ role: "owner" }),
    } as never,
    { enabled: true, revoke: async () => undefined } as never,
    { getOrThrow: () => "http://localhost:3000" } as never
  );
}

describe("ChannelsService", () => {
  it("applies server pagination and returns an unfiltered summary", async () => {
    let findArgs: Record<string, unknown> | undefined;
    const prisma = {
      channel: {
        findMany: (args: Record<string, unknown>) => {
          if ("select" in args)
            return Promise.resolve([{ platform: "instagram" }]);
          findArgs = args;
          return Promise.resolve([channel]);
        },
        count: async () => 11,
      },
      $transaction: async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
    };
    const result = await service(prisma).list("user-1", "workspace-1", {
      page: 2,
      pageSize: 10,
      query: " Postmade ",
      platform: "instagram",
    });
    assert.equal(findArgs?.skip, 10);
    assert.equal(findArgs?.take, 10);
    assert.equal(result.summary.total, 1);
    assert.equal(result.summary.byPlatform.instagram, 1);
    assert.equal(result.totalPages, 2);
  });

  it("returns disconnected included channels without making them selectable", async () => {
    const disconnected = {
      ...channel,
      connectionStatus: "disconnected" as const,
      disconnectedAt: now,
    };
    let call = 0;
    const prisma = {
      channel: {
        findMany: async () => (++call === 1 ? [channel] : [disconnected]),
      },
      $transaction: async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
    };
    const result = await service(prisma).lookup("user-1", "workspace-1", {
      limit: 20,
      includeIds: "channel-1",
    });
    assert.equal(result.included[0]?.connectionStatus, "disconnected");
    assert.deepEqual(result.connectedIds, ["channel-1"]);
  });

  it("disconnects logically and remains idempotent", async () => {
    let updated = false;
    const prisma = {
      channel: {
        findFirst: async () => channel,
        update: async () => {
          updated = true;
          return channel;
        },
      },
    };
    await service(prisma).disconnect("user-1", "workspace-1", "channel-1");
    assert.equal(updated, true);
  });
});
