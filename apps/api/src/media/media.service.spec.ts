import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MediaService } from "./media.service.js";

const asset = (overrides: Record<string, unknown> = {}) => ({
  id: "media-1",
  workspaceId: "workspace-1",
  createdBy: "user-1",
  objectKey: "workspaces/workspace-1/media/media-1/original",
  type: "image",
  filename: "photo.png",
  mimeType: "image/png",
  declaredSize: 8,
  confirmedSize: null,
  etag: null,
  status: "pending",
  expiresAt: new Date(Date.now() + 60_000),
  uploadedAt: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("MediaService", () => {
  it("creates a private direct upload without exposing the object key", async () => {
    let data: any;
    const prisma = {
      mediaAsset: { create: async (input: any) => (data = asset(input.data)) },
    };
    const access = { requireRole: async () => ({ role: "editor" }) };
    const storage = { signUpload: async () => "https://signed.example/upload" };
    const redis = { assertLimit: async () => true };
    const service = new MediaService(
      prisma as never,
      access as never,
      storage as never,
      redis as never
    );
    const result = await service.createUpload("user-1", "workspace-1", {
      filename: "photo.png",
      mimeType: "image/png",
      size: 8,
    });
    assert.equal(result.uploadUrl, "https://signed.example/upload");
    assert.equal(result.requiredHeaders["Content-Type"], "image/png");
    assert.equal("objectKey" in result.media, false);
    assert.equal("url" in result.media, false);
    assert.match(
      data.objectKey,
      /^workspaces\/workspace-1\/media\/.+\/original$/
    );
  });

  it("completes an upload idempotently after metadata and signature validation", async () => {
    let current = asset();
    const prisma = {
      mediaAsset: {
        findFirst: async () => current,
        update: async ({ data }: any) => (current = { ...current, ...data }),
      },
    };
    const access = { requireRole: async () => ({ role: "owner" }) };
    const storage = {
      head: async () => ({
        ContentLength: 8,
        ContentType: "image/png",
        ETag: "etag",
      }),
      readPrefix: async () =>
        Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    };
    const redis = { assertLimit: async () => true };
    const service = new MediaService(
      prisma as never,
      access as never,
      storage as never,
      redis as never
    );
    assert.equal(
      (await service.complete("user-1", "workspace-1", "media-1")).status,
      "ready"
    );
    assert.equal(
      (await service.complete("user-1", "workspace-1", "media-1")).status,
      "ready"
    );
  });
});
