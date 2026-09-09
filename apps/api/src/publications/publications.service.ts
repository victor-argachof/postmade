import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { apiError } from "../common/api-error.js";
import { Prisma, type PublicationStatus } from "../generated/prisma/client.js";
import { PrismaService } from "../infrastructure/prisma.service.js";
import { WorkspaceAccessService } from "../workspaces/workspace-access.service.js";
import type {
  PublicationBodyDto,
  PublicationsQueryDto,
  TagSnapshotDto,
} from "./publications.dto.js";

const MANAGE_ROLES = ["owner", "admin", "editor"] as const;
const CHARACTER_LIMITS = {
  facebook: 63206,
  linkedin: 3000,
  instagram: 2200,
  tiktok: 2200,
  youtube: 5000,
} as const;
const MEDIA_REQUIRED = new Set(["instagram", "tiktok", "youtube"]);
const MEDIA_LIMITS = {
  facebook: 10,
  linkedin: 9,
  instagram: 10,
  tiktok: 1,
  youtube: 1,
} as const;
const includeTargets = {
  targets: { orderBy: { id: "asc" as const } },
  media: {
    orderBy: { position: "asc" as const },
    include: { mediaAsset: true },
  },
};
const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class PublicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService
  ) {}

  private shape(publication: any) {
    return {
      id: publication.id,
      createdBy: publication.createdBy,
      title: publication.title,
      status: publication.status,
      content: publication.content,
      media: publication.media
        .filter((item: any) => item.mediaAsset.status !== "deleted")
        .map((item: any) => ({
          id: item.mediaAsset.id,
          type: item.mediaAsset.type,
          filename: item.mediaAsset.filename,
          mimeType: item.mediaAsset.mimeType,
          size: item.mediaAsset.confirmedSize ?? item.mediaAsset.declaredSize,
          status: item.mediaAsset.status,
        })),
      targets: publication.targets.map((target: any) => ({
        channelId: target.channelId,
        platform: target.platform,
        contentOverride: target.contentOverride,
        tagGroupSnapshotsOverride: target.tagGroupSnapshotsOverride,
        mediaOverride: null,
        settings: target.settings,
        status: target.status,
        errorCode: target.errorCode,
        externalUrl: target.externalUrl,
      })),
      tagGroupSnapshots: publication.tagGroupSnapshots,
      scheduledFor: publication.scheduledFor?.toISOString() ?? null,
      publishedAt: publication.publishedAt?.toISOString() ?? null,
      createdAt: publication.createdAt.toISOString(),
      updatedAt: publication.updatedAt.toISOString(),
    };
  }

  private hashtags(snapshots: TagSnapshotDto[]) {
    const seen = new Set<string>();
    return snapshots
      .flatMap((group) => group.tags)
      .filter((tag) => {
        const normalized = tag.trim().replace(/^#+/, "");
        const key = normalized.toLocaleLowerCase("en-US");
        if (!normalized || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((tag) => `#${tag.trim().replace(/^#+/, "")}`)
      .join(" ");
  }

  private effectiveContent(content: string, snapshots: TagSnapshotDto[]) {
    const tags = this.hashtags(snapshots);
    return [content.trim(), tags].filter(Boolean).join("\n\n");
  }

  private validationError(
    details: Array<{
      field: string;
      code: string;
      params?: Record<string, number | string>;
    }>
  ): never {
    throw new BadRequestException(
      apiError("VALIDATION_ERROR", "Request validation failed", details)
    );
  }

  private validateSnapshots(snapshots: TagSnapshotDto[], field: string) {
    const details: Array<{
      field: string;
      code: string;
      params?: Record<string, number>;
    }> = [];
    if (snapshots.length > 30)
      details.push({ field, code: "TOO_MANY", params: { max: 30 } });
    for (const snapshot of snapshots) {
      if (!snapshot.groupId.trim() || !snapshot.groupName.trim())
        details.push({ field, code: "INVALID_VALUE" });
      if (snapshot.tags.length > 30)
        details.push({ field, code: "TOO_MANY", params: { max: 30 } });
    }
    if (details.length) this.validationError(details);
  }

  private async prepare(
    transaction: Prisma.TransactionClient,
    workspaceId: string,
    input: PublicationBodyDto
  ) {
    this.validateSnapshots(input.tagGroupSnapshots, "tagGroupSnapshots");
    const mediaIds = input.mediaIds ?? [];
    if (new Set(mediaIds).size !== mediaIds.length)
      this.validationError([{ field: "mediaIds", code: "DUPLICATE" }]);
    const media = mediaIds.length
      ? await transaction.$queryRaw<Array<{ id: string; type: string }>>(
          Prisma.sql`SELECT "id", "type" FROM "MediaAsset" WHERE "id" IN (${Prisma.join(mediaIds)}) AND "workspaceId" = ${workspaceId} AND "status" = 'ready' FOR UPDATE`
        )
      : [];
    if (media.length !== mediaIds.length)
      this.validationError([{ field: "mediaIds", code: "MEDIA_NOT_READY" }]);
    const ids = input.targets.map((target) => target.channelId);
    if (new Set(ids).size !== ids.length)
      this.validationError([{ field: "targets", code: "DUPLICATE" }]);
    const channels = await transaction.channel.findMany({
      where: { workspaceId, id: { in: ids } },
    });
    if (channels.length !== ids.length)
      this.validationError([{ field: "targets", code: "INVALID_CHANNEL" }]);
    const byId = new Map(channels.map((channel) => [channel.id, channel]));
    const normalizedStatus = input.status as PublicationStatus;
    if (normalizedStatus !== "draft") {
      const details: Array<{
        field: string;
        code: string;
        params?: Record<string, number | string>;
      }> = [];
      if (!input.targets.length)
        details.push({ field: "targets", code: "REQUIRED" });
      for (const [index, target] of input.targets.entries()) {
        const channel = byId.get(target.channelId)!;
        if (channel.connectionStatus !== "connected")
          details.push({
            field: `targets.${index}.channelId`,
            code: "CHANNEL_NOT_CONNECTED",
          });
        if (MEDIA_REQUIRED.has(channel.platform) && media.length === 0)
          details.push({
            field: `targets.${index}.media`,
            code: "MEDIA_REQUIRED",
          });
        if (media.length > MEDIA_LIMITS[channel.platform])
          details.push({
            field: `targets.${index}.media`,
            code: "TOO_MANY",
            params: { max: MEDIA_LIMITS[channel.platform] },
          });
        if (
          (channel.platform === "tiktok" || channel.platform === "youtube") &&
          media.some((asset) => asset.type !== "video")
        )
          details.push({
            field: `targets.${index}.media`,
            code: "MEDIA_TYPE_NOT_SUPPORTED",
          });
        const snapshots =
          target.tagGroupSnapshotsOverride ?? input.tagGroupSnapshots;
        this.validateSnapshots(
          snapshots,
          `targets.${index}.tagGroupSnapshotsOverride`
        );
        const content = this.effectiveContent(
          target.contentOverride?.trim() || input.content,
          snapshots
        );
        if (!content && media.length === 0)
          details.push({ field: `targets.${index}.content`, code: "REQUIRED" });
        const max = CHARACTER_LIMITS[channel.platform];
        if (content.length > max)
          details.push({
            field: `targets.${index}.content`,
            code: "TOO_LONG",
            params: { max },
          });
      }
      if (input.status === "scheduled") {
        if (!input.scheduledFor)
          details.push({ field: "scheduledFor", code: "REQUIRED" });
        else {
          const scheduled = new Date(input.scheduledFor).getTime();
          if (scheduled < Date.now() + 5 * 60 * 1000)
            details.push({
              field: "scheduledFor",
              code: "TOO_SOON",
              params: { minutes: 5 },
            });
          if (scheduled > Date.now() + 90 * DAY)
            details.push({
              field: "scheduledFor",
              code: "TOO_FAR",
              params: { days: 90 },
            });
        }
      }
      if (details.length) this.validationError(details);
    }
    return input.targets.map((target) => {
      const channel = byId.get(target.channelId)!;
      return {
        channelId: channel.id,
        platform: channel.platform,
        contentOverride: target.contentOverride?.trim() || null,
        tagGroupSnapshotsOverride:
          target.tagGroupSnapshotsOverride === null ||
          target.tagGroupSnapshotsOverride === undefined
            ? undefined
            : (target.tagGroupSnapshotsOverride as unknown as Prisma.InputJsonValue),
        settings: (target.settings ?? {}) as Prisma.InputJsonValue,
        status: normalizedStatus,
      };
    });
  }

  private mediaCreate(mediaIds: string[]) {
    return mediaIds.map((mediaAssetId, position) => ({
      mediaAssetId,
      position,
    }));
  }

  private async recomputeMediaRetention(
    transaction: Prisma.TransactionClient,
    mediaIds: string[]
  ) {
    if (!mediaIds.length) return;
    const references = await transaction.publicationMedia.findMany({
      where: { mediaAssetId: { in: mediaIds } },
      include: { publication: true },
    });
    for (const mediaId of mediaIds) {
      const required = references
        .filter((reference) => reference.mediaAssetId === mediaId)
        .map(({ publication }) => {
          const base = publication.updatedAt.getTime();
          if (publication.status === "published")
            return (publication.publishedAt?.getTime() ?? base) + 2 * DAY;
          if (publication.status === "draft" || publication.status === "failed")
            return base + 7 * DAY;
          return (publication.scheduledFor?.getTime() ?? base) + 7 * DAY;
        });
      await transaction.mediaAsset.updateMany({
        where: { id: mediaId, status: { in: ["pending", "ready", "failed"] } },
        data: {
          expiresAt: new Date(
            required.length ? Math.max(...required) : Date.now() + DAY
          ),
        },
      });
    }
  }

  async list(userId: string, workspaceId: string, query: PublicationsQueryDto) {
    await this.access.requireMembership(userId, workspaceId);
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const range =
      from || to
        ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
        : undefined;
    const where: Prisma.PublicationWhereInput = {
      workspaceId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.platform || query.channelId
        ? {
            targets: {
              some: {
                ...(query.platform ? { platform: query.platform } : {}),
                ...(query.channelId ? { channelId: query.channelId } : {}),
              },
            },
          }
        : {}),
      ...(range
        ? {
            OR: [
              { scheduledFor: range },
              { scheduledFor: null, publishedAt: range },
              { scheduledFor: null, publishedAt: null, createdAt: range },
            ],
          }
        : {}),
      ...(query.query?.trim()
        ? {
            AND: {
              OR: [
                {
                  title: {
                    contains: query.query.trim(),
                    mode: "insensitive",
                  },
                },
                {
                  content: {
                    contains: query.query.trim(),
                    mode: "insensitive",
                  },
                },
              ],
            },
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.publication.findMany({
        where,
        include: includeTargets,
        orderBy: [
          { scheduledFor: { sort: "desc", nulls: "last" } },
          { publishedAt: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
          { id: "desc" },
        ],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.publication.count({ where }),
    ]);
    return {
      items: items.map((item) => this.shape(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  private async find(
    workspaceId: string,
    id: string,
    transaction: Prisma.TransactionClient | PrismaService = this.prisma
  ) {
    const publication = await transaction.publication.findFirst({
      where: { id, workspaceId },
      include: includeTargets,
    });
    if (!publication)
      throw new NotFoundException(
        apiError("PUBLICATION_NOT_FOUND", "Publication not found")
      );
    return publication;
  }

  async get(userId: string, workspaceId: string, id: string) {
    await this.access.requireMembership(userId, workspaceId);
    return this.shape(await this.find(workspaceId, id));
  }

  private async assertTrial(
    transaction: Prisma.TransactionClient,
    workspaceId: string,
    excludingId?: string
  ) {
    const workspace = await transaction.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });
    if (workspace.subscriptionStatus !== "trialing") return;
    const used = await transaction.publication.count({
      where: {
        workspaceId,
        status: { not: "draft" },
        ...(excludingId ? { id: { not: excludingId } } : {}),
      },
    });
    if (used >= 3)
      throw new ConflictException(
        apiError(
          "PUBLICATION_TRIAL_LIMIT_REACHED",
          "Workspace trial publication limit reached"
        )
      );
  }

  async create(userId: string, workspaceId: string, input: PublicationBodyDto) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        workspaceId
      );
      const targets = await this.prepare(tx, workspaceId, input);
      if (input.status !== "draft") await this.assertTrial(tx, workspaceId);
      const publication = await tx.publication.create({
        data: {
          workspaceId,
          createdBy: userId,
          title: input.title?.trim() || null,
          status: input.status,
          content: input.content.trim(),
          tagGroupSnapshots:
            input.tagGroupSnapshots as unknown as Prisma.InputJsonValue,
          scheduledFor:
            input.status === "scheduled" ? new Date(input.scheduledFor!) : null,
          publishedAt: input.status === "published" ? new Date() : null,
          targets: { create: targets },
          media: { create: this.mediaCreate(input.mediaIds ?? []) },
        },
        include: includeTargets,
      });
      await this.recomputeMediaRetention(tx, input.mediaIds ?? []);
      return this.shape(publication);
    });
  }

  async update(
    userId: string,
    workspaceId: string,
    id: string,
    input: PublicationBodyDto
  ) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        workspaceId
      );
      const existing = await this.find(workspaceId, id, tx);
      const previousMediaIds = existing.media.map(
        (item: any) => item.mediaAssetId
      );
      if (["published", "publishing"].includes(existing.status))
        throw new ConflictException(
          apiError("PUBLICATION_IMMUTABLE", "Publication is immutable")
        );
      const targets = await this.prepare(tx, workspaceId, input);
      if (existing.status === "draft" && input.status !== "draft")
        await this.assertTrial(tx, workspaceId, id);
      await tx.publicationTarget.deleteMany({ where: { publicationId: id } });
      await tx.publicationMedia.deleteMany({ where: { publicationId: id } });
      const updated = await tx.publication.update({
        where: { id },
        data: {
          status: input.status,
          title: input.title?.trim() || null,
          content: input.content.trim(),
          tagGroupSnapshots:
            input.tagGroupSnapshots as unknown as Prisma.InputJsonValue,
          scheduledFor:
            input.status === "scheduled" ? new Date(input.scheduledFor!) : null,
          publishedAt: input.status === "published" ? new Date() : null,
          targets: { create: targets },
          media: { create: this.mediaCreate(input.mediaIds ?? []) },
        },
        include: includeTargets,
      });
      await this.recomputeMediaRetention(tx, [
        ...new Set([...previousMediaIds, ...(input.mediaIds ?? [])]),
      ]);
      return this.shape(updated);
    });
  }

  async delete(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    await this.prisma.$transaction(async (tx) => {
      const existing = await this.find(workspaceId, id, tx);
      if (["published", "publishing"].includes(existing.status))
        throw new ConflictException(
          apiError("PUBLICATION_IMMUTABLE", "Publication is immutable")
        );
      const mediaIds = existing.media.map((item: any) => item.mediaAssetId);
      await tx.publication.delete({ where: { id } });
      await this.recomputeMediaRetention(tx, mediaIds);
    });
  }

  async duplicate(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    const source = await this.find(workspaceId, id);
    return this.prisma.$transaction(async (tx) => {
      const available = source.media.filter(
        (item: any) => item.mediaAsset.status === "ready"
      );
      const duplicated = await tx.publication.create({
        data: {
          workspaceId,
          createdBy: userId,
          status: "draft",
          title: source.title,
          content: source.content,
          tagGroupSnapshots: source.tagGroupSnapshots as Prisma.InputJsonValue,
          targets: {
            create: source.targets.map((target) => ({
              channelId: target.channelId,
              platform: target.platform,
              contentOverride: target.contentOverride,
              tagGroupSnapshotsOverride:
                target.tagGroupSnapshotsOverride == null
                  ? undefined
                  : (target.tagGroupSnapshotsOverride as Prisma.InputJsonValue),
              settings: target.settings as Prisma.InputJsonValue,
              status: "draft",
            })),
          },
          media: {
            create: available.map((item: any, position: number) => ({
              mediaAssetId: item.mediaAssetId,
              position,
            })),
          },
        },
        include: includeTargets,
      });
      await this.recomputeMediaRetention(
        tx,
        available.map((item: any) => item.mediaAssetId)
      );
      return this.shape(duplicated);
    });
  }

  private invalidStatus(): never {
    throw new ConflictException(
      apiError(
        "PUBLICATION_INVALID_STATUS",
        "Publication status does not allow this action"
      )
    );
  }

  async updateTitle(
    userId: string,
    workspaceId: string,
    id: string,
    title: string | null | undefined
  ) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    await this.find(workspaceId, id);
    return this.shape(
      await this.prisma.publication.update({
        where: { id },
        data: { title: title?.trim() || null },
        include: includeTargets,
      })
    );
  }

  async cancel(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.find(workspaceId, id, tx);
      if (existing.status !== "scheduled") this.invalidStatus();
      const updated = await tx.publication.update({
        where: { id },
        data: {
          status: "draft",
          scheduledFor: null,
          targets: { updateMany: { where: {}, data: { status: "draft" } } },
        },
        include: includeTargets,
      });
      await this.recomputeMediaRetention(
        tx,
        existing.media.map((item: any) => item.mediaAssetId)
      );
      return this.shape(updated);
    });
  }

  async retry(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.find(workspaceId, id, tx);
      if (existing.status !== "failed") this.invalidStatus();
      const scheduled =
        existing.scheduledFor && existing.scheduledFor.getTime() > Date.now();
      const status: PublicationStatus = scheduled ? "scheduled" : "published";
      const updated = await tx.publication.update({
        where: { id },
        data: {
          status,
          publishedAt: scheduled ? null : new Date(),
          targets: {
            updateMany: { where: {}, data: { status, errorCode: null } },
          },
        },
        include: includeTargets,
      });
      await this.recomputeMediaRetention(
        tx,
        existing.media.map((item: any) => item.mediaAssetId)
      );
      return this.shape(updated);
    });
  }
}
