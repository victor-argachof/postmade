import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PublicationsService } from "./publications.service.js";

const now = new Date("2026-08-26T12:00:00.000Z");
const publication = (overrides: Record<string, unknown> = {}) => ({
  id: "publication-1",
  workspaceId: "workspace-1",
  createdBy: "user-1",
  status: "draft",
  content: "",
  tagGroupSnapshots: [],
  scheduledFor: null,
  publishedAt: null,
  createdAt: now,
  updatedAt: now,
  targets: [],
  ...overrides,
});

describe("PublicationsService", () => {
  it("creates an incomplete draft and keeps server-controlled fields", async () => {
    const tx = {
      $executeRawUnsafe: async () => undefined,
      channel: { findMany: async () => [] },
      publication: {
        create: async ({ data }: any) => publication({ content: data.content }),
      },
      workspace: {
        findUniqueOrThrow: async () => ({ subscriptionStatus: "trialing" }),
      },
    };
    const prisma = { $transaction: async (callback: any) => callback(tx) };
    const access = { requireRole: async () => ({ role: "editor" }) };
    const service = new PublicationsService(prisma as never, access as never);

    const result = await service.create("user-1", "workspace-1", {
      status: "draft",
      content: "",
      targets: [],
      tagGroupSnapshots: [],
    });

    assert.equal(result.id, "publication-1");
    assert.equal(result.createdBy, "user-1");
    assert.deepEqual(result.media, []);
  });

  it("rejects publishing to a platform that requires unavailable media", async () => {
    const tx = {
      $executeRawUnsafe: async () => undefined,
      channel: {
        findMany: async () => [
          {
            id: "instagram-1",
            workspaceId: "workspace-1",
            platform: "instagram",
            connectionStatus: "connected",
          },
        ],
      },
    };
    const prisma = { $transaction: async (callback: any) => callback(tx) };
    const access = { requireRole: async () => ({ role: "owner" }) };
    const service = new PublicationsService(prisma as never, access as never);

    await assert.rejects(
      service.create("user-1", "workspace-1", {
        status: "published",
        content: "Hello",
        targets: [{ channelId: "instagram-1" }],
        tagGroupSnapshots: [],
      }),
      (error: any) =>
        error
          .getResponse()
          .details.some((detail: any) => detail.code === "MEDIA_REQUIRED")
    );
  });

  it("returns paginated results isolated by workspace", async () => {
    let capturedWhere: unknown;
    const prisma = {
      $transaction: async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
      publication: {
        findMany: async ({ where }: any) => {
          capturedWhere = where;
          return [publication()];
        },
        count: async () => 1,
      },
    };
    const access = { requireMembership: async () => ({ role: "viewer" }) };
    const service = new PublicationsService(prisma as never, access as never);
    const result = await service.list("user-1", "workspace-1", {
      page: 1,
      pageSize: 10,
    });
    assert.deepEqual(capturedWhere, { workspaceId: "workspace-1" });
    assert.equal(result.totalPages, 1);
  });
});
