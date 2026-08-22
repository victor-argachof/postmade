import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ConflictException } from "@nestjs/common";

import { TagsService } from "./tags.service.js";

const now = new Date("2026-08-22T12:00:00Z");

describe("TagsService", () => {
  it("applies server pagination, search and sorting", async () => {
    let listArgs: Record<string, unknown> | undefined;
    const prisma = {
      tagGroup: {
        findMany: (args: Record<string, unknown>) => {
          listArgs = args;
          return Promise.resolve([]);
        },
        count: async () => 26,
      },
      $transaction: async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
    };
    const access = { requireMembership: async () => ({ role: "viewer" }) };
    const service = new TagsService(prisma as never, access as never);

    const result = await service.list("user-1", "workspace-1", {
      page: 2,
      pageSize: 25,
      query: " Social ",
      sortBy: "tagCount",
      sortDirection: "desc",
    });

    assert.equal(listArgs?.skip, 25);
    assert.equal(listArgs?.take, 25);
    assert.deepEqual(listArgs?.orderBy, [{ tagCount: "desc" }, { id: "asc" }]);
    assert.equal(result.totalPages, 2);
  });

  it("normalizes and deduplicates tags when creating a group", async () => {
    let createdData: Record<string, unknown> | undefined;
    const prisma = {
      tagGroup: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          createdData = data;
          return { id: "tag-1", ...data, createdAt: now, updatedAt: now };
        },
      },
    };
    const access = { requireRole: async () => ({ role: "editor" }) };
    const service = new TagsService(prisma as never, access as never);

    const result = await service.create("user-1", "workspace-1", {
      name: "  Campanha  ",
      tags: ["#Postmade", "postmade", " conteúdo "],
    });

    assert.equal(result.name, "Campanha");
    assert.deepEqual(result.tags, ["Postmade", "conteúdo"]);
    assert.equal(createdData?.normalizedName, "campanha");
    assert.equal(createdData?.tagCount, 2);
  });

  it("converts concurrent name uniqueness failures to a typed conflict", async () => {
    const prisma = {
      tagGroup: { create: async () => Promise.reject({ code: "P2002" }) },
    };
    const access = { requireRole: async () => ({ role: "owner" }) };
    const service = new TagsService(prisma as never, access as never);

    await assert.rejects(
      service.create("user-1", "workspace-1", {
        name: "Campanha",
        tags: ["tag"],
      }),
      (error: unknown) =>
        error instanceof ConflictException &&
        (error.getResponse() as { code: string }).code ===
          "TAG_GROUP_NAME_CONFLICT"
    );
  });

  it("returns lookup options and only existing selected IDs", async () => {
    const option = {
      id: "tag-1",
      name: "Campanha",
      tags: ["postmade"],
      createdBy: "user-1",
      createdAt: now,
      updatedAt: now,
    };
    const prisma = {
      tagGroup: {
        findMany: ({ select }: { select?: { id: boolean } }) =>
          Promise.resolve(select ? [{ id: "tag-1" }] : [option]),
      },
      $transaction: async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
    };
    const access = { requireMembership: async () => ({ role: "viewer" }) };
    const service = new TagsService(prisma as never, access as never);

    const result = await service.lookup("user-1", "workspace-1", {
      limit: 20,
      includeIds: "tag-1,tag-removed",
    });
    assert.deepEqual(result.existingIds, ["tag-1"]);
    assert.equal(result.options[0]?.id, "tag-1");
  });
});
