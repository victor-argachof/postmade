import { randomBytes, randomUUID } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SocialPlatform } from "@postmade/types";

import { apiError } from "../common/api-error.js";
import type { Channel } from "../generated/prisma/client.js";
import { PrismaService } from "../infrastructure/prisma.service.js";
import { RedisService } from "../infrastructure/redis.service.js";
import { WorkspaceAccessService } from "../workspaces/workspace-access.service.js";
import { MockChannelProvider } from "./channel-provider.js";
import type {
  ChannelsLookupQueryDto,
  ChannelsQueryDto,
} from "./channels.dto.js";

const ACTIVE_STATUSES = [
  "connected",
  "requires_reauthentication",
  "unavailable",
] as const;
const PLATFORMS: SocialPlatform[] = [
  "facebook",
  "linkedin",
  "instagram",
  "tiktok",
  "youtube",
];
const OAUTH_TTL_SECONDS = 600;

interface OAuthState {
  workspaceId: string;
  userId: string;
  platform: SocialPlatform;
  providerAccountId: string;
}

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly access: WorkspaceAccessService,
    private readonly provider: MockChannelProvider,
    private readonly config: ConfigService
  ) {}

  private shape(channel: Channel) {
    return {
      id: channel.id,
      workspaceId: channel.workspaceId,
      platform: channel.platform,
      displayName: channel.displayName,
      username: channel.username,
      avatarUrl: channel.avatarUrl,
      connectionStatus: channel.connectionStatus,
      lastCheckedAt: channel.lastCheckedAt?.toISOString() ?? null,
      connectedAt: channel.connectedAt.toISOString(),
      disconnectedAt: channel.disconnectedAt?.toISOString() ?? null,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
    };
  }

  private parseIds(value?: string) {
    const ids = [
      ...new Set(
        (value ?? "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      ),
    ];
    if (ids.length > 50)
      throw new BadRequestException(
        apiError("VALIDATION_ERROR", "Request validation failed", [
          { field: "includeIds", code: "TOO_MANY", params: { max: 50 } },
        ])
      );
    return ids;
  }

  async list(userId: string, workspaceId: string, query: ChannelsQueryDto) {
    await this.access.requireMembership(userId, workspaceId);
    const search = query.query?.trim().toLocaleLowerCase("en-US") ?? "";
    const activeWhere = {
      workspaceId,
      connectionStatus: { in: [...ACTIVE_STATUSES] },
    };
    const where = {
      ...activeWhere,
      ...(query.platform ? { platform: query.platform } : {}),
      ...(search ? { searchText: { contains: search } } : {}),
    };
    const [items, total, summaryItems] = await this.prisma.$transaction([
      this.prisma.channel.findMany({
        where,
        orderBy: [{ displayName: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.channel.count({ where }),
      this.prisma.channel.findMany({
        where: activeWhere,
        select: { platform: true },
      }),
    ]);
    const byPlatform = Object.fromEntries(
      PLATFORMS.map((platform) => [platform, 0])
    ) as Record<SocialPlatform, number>;
    for (const item of summaryItems) byPlatform[item.platform] += 1;
    const summaryTotal = Object.values(byPlatform).reduce(
      (sum, count) => sum + count,
      0
    );
    return {
      items: items.map((item) => this.shape(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
      summary: { total: summaryTotal, byPlatform },
    };
  }

  async lookup(
    userId: string,
    workspaceId: string,
    query: ChannelsLookupQueryDto
  ) {
    await this.access.requireMembership(userId, workspaceId);
    const includeIds = this.parseIds(query.includeIds);
    const search = query.query?.trim().toLocaleLowerCase("en-US") ?? "";
    const [options, included] = await this.prisma.$transaction([
      this.prisma.channel.findMany({
        where: {
          workspaceId,
          connectionStatus: { in: [...ACTIVE_STATUSES] },
          ...(search ? { searchText: { contains: search } } : {}),
        },
        orderBy: [{ displayName: "asc" }, { id: "asc" }],
        take: query.limit,
      }),
      this.prisma.channel.findMany({
        where: { workspaceId, id: { in: includeIds } },
        orderBy: [{ displayName: "asc" }, { id: "asc" }],
      }),
    ]);
    return {
      options: options.map((item) => this.shape(item)),
      included: included.map((item) => this.shape(item)),
      connectedIds: [...options, ...included]
        .filter((item) => item.connectionStatus === "connected")
        .map((item) => item.id),
    };
  }

  private async assertCapacity(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });
    const limit =
      workspace.subscriptionStatus === "trialing"
        ? 3
        : workspace.subscriptionChannels;
    const occupied = await this.prisma.channel.count({
      where: {
        workspaceId,
        connectionStatus: { in: [...ACTIVE_STATUSES] },
      },
    });
    if (occupied >= limit)
      throw new ConflictException(
        apiError("CHANNEL_LIMIT_REACHED", "Workspace channel limit reached")
      );
  }

  async startOAuth(
    userId: string,
    workspaceId: string,
    platform: SocialPlatform
  ) {
    if (!PLATFORMS.includes(platform))
      throw new BadRequestException(
        apiError("VALIDATION_ERROR", "Request validation failed", [
          { field: "platform", code: "INVALID_VALUE" },
        ])
      );
    await this.access.requireRole(userId, workspaceId, ["owner", "admin"]);
    if (!this.provider.enabled)
      throw new ConflictException(
        apiError(
          "CHANNEL_PROVIDER_UNAVAILABLE",
          "Channel provider is unavailable"
        )
      );
    if (!(await this.redis.assertLimit("channel-oauth", userId, 10, 60)))
      throw new HttpException(
        apiError("RATE_LIMITED", "Too many channel connection attempts"),
        HttpStatus.TOO_MANY_REQUESTS
      );
    await this.assertCapacity(workspaceId);
    const state = randomBytes(32).toString("base64url");
    const payload: OAuthState = {
      workspaceId,
      userId,
      platform,
      providerAccountId: `mock:${platform}:${randomUUID()}`,
    };
    await this.redis.client.set(
      `channel-oauth:${state}`,
      JSON.stringify(payload),
      "EX",
      OAUTH_TTL_SECONDS
    );
    const apiUrl = this.config.getOrThrow<string>("API_PUBLIC_URL");
    return {
      url: `${apiUrl}/api/v1/channels/oauth/mock/callback?state=${encodeURIComponent(state)}`,
    };
  }

  async completeMockOAuth(state: string) {
    if (!this.provider.enabled)
      throw new ConflictException(
        apiError(
          "CHANNEL_PROVIDER_UNAVAILABLE",
          "Channel provider is unavailable"
        )
      );
    const raw = await this.redis.client.getdel(`channel-oauth:${state}`);
    if (!raw)
      throw new BadRequestException(
        apiError("INVALID_OAUTH_STATE", "OAuth state is invalid or expired")
      );
    const payload = JSON.parse(raw) as OAuthState;
    await this.access.requireRole(payload.userId, payload.workspaceId, [
      "owner",
      "admin",
    ]);
    await this.assertCapacity(payload.workspaceId);
    const account = this.provider.createAccount(
      payload.platform,
      payload.providerAccountId
    );
    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        payload.workspaceId
      );
      const workspace = await transaction.workspace.findUniqueOrThrow({
        where: { id: payload.workspaceId },
      });
      const existing = await transaction.channel.findUnique({
        where: {
          workspaceId_platform_providerAccountId: {
            workspaceId: payload.workspaceId,
            platform: payload.platform,
            providerAccountId: account.providerAccountId,
          },
        },
      });
      if (existing && existing.connectionStatus !== "disconnected")
        throw new ConflictException(
          apiError(
            "CHANNEL_ALREADY_CONNECTED",
            "Channel account is already connected"
          )
        );
      const occupied = await transaction.channel.count({
        where: {
          workspaceId: payload.workspaceId,
          connectionStatus: { in: [...ACTIVE_STATUSES] },
        },
      });
      const limit =
        workspace.subscriptionStatus === "trialing"
          ? 3
          : workspace.subscriptionChannels;
      if (occupied >= limit)
        throw new ConflictException(
          apiError("CHANNEL_LIMIT_REACHED", "Workspace channel limit reached")
        );
      const searchText =
        `${account.displayName} ${account.username}`.toLocaleLowerCase("en-US");
      await transaction.channel.upsert({
        where: {
          workspaceId_platform_providerAccountId: {
            workspaceId: payload.workspaceId,
            platform: payload.platform,
            providerAccountId: account.providerAccountId,
          },
        },
        create: {
          ...account,
          workspaceId: payload.workspaceId,
          platform: payload.platform,
          searchText,
          connectionStatus: "connected",
          createdBy: payload.userId,
        },
        update: {
          displayName: account.displayName,
          username: account.username,
          avatarUrl: account.avatarUrl,
          searchText,
          connectionStatus: "connected",
          connectedAt: now,
          disconnectedAt: null,
        },
      });
    });
    return payload.platform;
  }

  async disconnect(userId: string, workspaceId: string, channelId: string) {
    await this.access.requireRole(userId, workspaceId, ["owner", "admin"]);
    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, workspaceId },
    });
    if (!channel)
      throw new NotFoundException(
        apiError("CHANNEL_NOT_FOUND", "Channel not found")
      );
    if (channel.connectionStatus === "disconnected") return;
    await this.provider.revoke(channel.providerAccountId);
    await this.prisma.channel.update({
      where: { id: channel.id },
      data: { connectionStatus: "disconnected", disconnectedAt: new Date() },
    });
  }
}
