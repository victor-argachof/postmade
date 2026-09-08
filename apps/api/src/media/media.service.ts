import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { apiError } from "../common/api-error.js";
import { ObjectStorageService } from "../infrastructure/object-storage.service.js";
import { PrismaService } from "../infrastructure/prisma.service.js";
import { RedisService } from "../infrastructure/redis.service.js";
import { WorkspaceAccessService } from "../workspaces/workspace-access.service.js";
import type { CreateMediaUploadDto } from "./media.dto.js";

const MANAGE_ROLES = ["owner", "admin", "editor"] as const;
const MIME_TYPES = new Map([
  ["image/jpeg", { type: "image", max: 10 * 1024 * 1024 }],
  ["image/png", { type: "image", max: 10 * 1024 * 1024 }],
  ["image/webp", { type: "image", max: 10 * 1024 * 1024 }],
  ["video/mp4", { type: "video", max: 100 * 1024 * 1024 }],
  ["video/quicktime", { type: "video", max: 100 * 1024 * 1024 }],
]);
const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly storage: ObjectStorageService,
    private readonly redis: RedisService
  ) {}

  private shape(asset: any) {
    return {
      id: asset.id,
      type: asset.type,
      filename: asset.filename,
      mimeType: asset.mimeType,
      size: asset.confirmedSize ?? asset.declaredSize,
      status: asset.status,
    };
  }

  private async find(workspaceId: string, id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, workspaceId },
    });
    if (!asset)
      throw new NotFoundException(
        apiError("MEDIA_NOT_FOUND", "Media not found")
      );
    return asset;
  }

  private async rate(scope: string, userId: string) {
    if (!(await this.redis.assertLimit(scope, userId, 30, 60)))
      throw new HttpException(
        apiError("RATE_LIMITED", "Rate limit exceeded"),
        429
      );
  }

  async createUpload(
    userId: string,
    workspaceId: string,
    input: CreateMediaUploadDto
  ) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    await this.rate("media-upload", userId);
    const rule = MIME_TYPES.get(input.mimeType);
    if (!rule || input.size > rule.max)
      throw new BadRequestException(
        apiError("MEDIA_INVALID_TYPE", "Unsupported media type or size")
      );
    const id = crypto.randomUUID();
    const objectKey = `workspaces/${workspaceId}/media/${id}/original`;
    const asset = await this.prisma.mediaAsset.create({
      data: {
        id,
        workspaceId,
        createdBy: userId,
        objectKey,
        type: rule.type,
        filename: input.filename,
        mimeType: input.mimeType,
        declaredSize: input.size,
        expiresAt: new Date(Date.now() + DAY),
      },
    });
    const uploadUrl = await this.storage.signUpload(objectKey, input.mimeType);
    return {
      media: this.shape(asset),
      uploadUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      requiredHeaders: { "Content-Type": input.mimeType },
    };
  }

  private validSignature(mime: string, bytes: Uint8Array) {
    const ascii = String.fromCharCode(...bytes);
    if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
    if (mime === "image/png") return ascii.startsWith("\u0089PNG\r\n\u001a\n");
    if (mime === "image/webp")
      return ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP";
    if (mime === "video/mp4" || mime === "video/quicktime")
      return ascii.slice(4, 8) === "ftyp";
    return false;
  }

  async complete(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    await this.rate("media-complete", userId);
    const asset = await this.find(workspaceId, id);
    if (asset.status === "ready") return this.shape(asset);
    if (asset.status !== "pending" || asset.expiresAt <= new Date())
      throw new ConflictException(
        apiError("MEDIA_UPLOAD_EXPIRED", "Media upload expired")
      );
    const head = await this.storage.head(asset.objectKey);
    if (
      head.ContentLength !== asset.declaredSize ||
      head.ContentType !== asset.mimeType
    ) {
      await this.prisma.mediaAsset.update({
        where: { id },
        data: { status: "failed" },
      });
      throw new BadRequestException(
        apiError("MEDIA_SIZE_MISMATCH", "Uploaded media metadata mismatch")
      );
    }
    const bytes = await this.storage.readPrefix(asset.objectKey);
    if (!this.validSignature(asset.mimeType, bytes)) {
      await this.prisma.mediaAsset.update({
        where: { id },
        data: { status: "failed" },
      });
      throw new BadRequestException(
        apiError("MEDIA_INVALID_TYPE", "Uploaded media signature is invalid")
      );
    }
    return this.shape(
      await this.prisma.mediaAsset.update({
        where: { id },
        data: {
          status: "ready",
          confirmedSize: head.ContentLength,
          etag: head.ETag,
          uploadedAt: new Date(),
        },
      })
    );
  }

  async accessUrl(userId: string, workspaceId: string, id: string) {
    await this.access.requireMembership(userId, workspaceId);
    const asset = await this.find(workspaceId, id);
    if (asset.status !== "ready")
      throw new ConflictException(
        apiError("MEDIA_NOT_READY", "Media is not ready")
      );
    return {
      url: await this.storage.signAccess(asset.objectKey),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async delete(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    const asset = await this.find(workspaceId, id);
    const used = await this.prisma.publicationMedia.count({
      where: { mediaAssetId: id },
    });
    if (used)
      throw new ConflictException(apiError("MEDIA_IN_USE", "Media is in use"));
    if (asset.status !== "deleted") await this.storage.delete(asset.objectKey);
    await this.prisma.mediaAsset.update({
      where: { id },
      data: { status: "deleted", deletedAt: new Date() },
    });
  }
}
