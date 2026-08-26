import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { apiError } from "../common/api-error.js";
import type { Prisma, PublicationStatus } from "../generated/prisma/client.js";
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
const includeTargets = { targets: { orderBy: { id: "asc" as const } } };

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
      status: publication.status,
      content: publication.content,
      media: [],
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
        if (MEDIA_REQUIRED.has(channel.platform))
          details.push({
            field: `targets.${index}.media`,
            code: "MEDIA_REQUIRED",
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
        if (!content)
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
        else if (new Date(input.scheduledFor).getTime() <= Date.now())
          details.push({ field: "scheduledFor", code: "MUST_BE_FUTURE" });
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
      ...(query.query?.trim()
        ? { content: { contains: query.query.trim(), mode: "insensitive" } }
        : {}),
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
          status: input.status,
          content: input.content.trim(),
          tagGroupSnapshots:
            input.tagGroupSnapshots as unknown as Prisma.InputJsonValue,
          scheduledFor:
            input.status === "scheduled" ? new Date(input.scheduledFor!) : null,
          publishedAt: input.status === "published" ? new Date() : null,
          targets: { create: targets },
        },
        include: includeTargets,
      });
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
      if (["published", "publishing"].includes(existing.status))
        throw new ConflictException(
          apiError("PUBLICATION_IMMUTABLE", "Publication is immutable")
        );
      const targets = await this.prepare(tx, workspaceId, input);
      if (existing.status === "draft" && input.status !== "draft")
        await this.assertTrial(tx, workspaceId, id);
      await tx.publicationTarget.deleteMany({ where: { publicationId: id } });
      return this.shape(
        await tx.publication.update({
          where: { id },
          data: {
            status: input.status,
            content: input.content.trim(),
            tagGroupSnapshots:
              input.tagGroupSnapshots as unknown as Prisma.InputJsonValue,
            scheduledFor:
              input.status === "scheduled"
                ? new Date(input.scheduledFor!)
                : null,
            publishedAt: input.status === "published" ? new Date() : null,
            targets: { create: targets },
          },
          include: includeTargets,
        })
      );
    });
  }

  async delete(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    const existing = await this.find(workspaceId, id);
    if (["published", "publishing"].includes(existing.status))
      throw new ConflictException(
        apiError("PUBLICATION_IMMUTABLE", "Publication is immutable")
      );
    await this.prisma.publication.delete({ where: { id } });
  }

  async duplicate(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    const source = await this.find(workspaceId, id);
    return this.shape(
      await this.prisma.publication.create({
        data: {
          workspaceId,
          createdBy: userId,
          status: "draft",
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
        },
        include: includeTargets,
      })
    );
  }

  private invalidStatus(): never {
    throw new ConflictException(
      apiError(
        "PUBLICATION_INVALID_STATUS",
        "Publication status does not allow this action"
      )
    );
  }

  async cancel(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    const existing = await this.find(workspaceId, id);
    if (existing.status !== "scheduled") this.invalidStatus();
    return this.shape(
      await this.prisma.publication.update({
        where: { id },
        data: {
          status: "draft",
          scheduledFor: null,
          targets: { updateMany: { where: {}, data: { status: "draft" } } },
        },
        include: includeTargets,
      })
    );
  }

  async retry(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    const existing = await this.find(workspaceId, id);
    if (existing.status !== "failed") this.invalidStatus();
    const scheduled =
      existing.scheduledFor && existing.scheduledFor.getTime() > Date.now();
    const status: PublicationStatus = scheduled ? "scheduled" : "published";
    return this.shape(
      await this.prisma.publication.update({
        where: { id },
        data: {
          status,
          publishedAt: scheduled ? null : new Date(),
          targets: {
            updateMany: { where: {}, data: { status, errorCode: null } },
          },
        },
        include: includeTargets,
      })
    );
  }
}
