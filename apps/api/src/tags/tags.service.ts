import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { apiError } from "../common/api-error.js";
import { PrismaService } from "../infrastructure/prisma.service.js";
import { WorkspaceAccessService } from "../workspaces/workspace-access.service.js";
import type {
  TagGroupBodyDto,
  TagGroupsLookupQueryDto,
  TagGroupsQueryDto,
} from "./tags.dto.js";

const MANAGE_ROLES = ["owner", "admin", "editor"] as const;
const TAG_PATTERN = /^[\p{L}\p{N}_]+$/u;

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService
  ) {}

  private normalizeName(value: string) {
    return value.trim();
  }
  private normalizeKey(value: string) {
    return value.toLocaleLowerCase("en-US");
  }
  private normalizeTags(values: string[]) {
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const value of values) {
      const tag = value.trim().replace(/^#+/, "");
      const key = this.normalizeKey(tag);
      if (!tag || seen.has(key)) continue;
      seen.add(key);
      tags.push(tag);
    }
    return tags;
  }
  private validation(input: TagGroupBodyDto) {
    const name = this.normalizeName(input.name);
    const tags = this.normalizeTags(input.tags);
    const details: Array<{
      field: string;
      code: string;
      params?: Record<string, number>;
    }> = [];
    if (name.length < 1) details.push({ field: "name", code: "REQUIRED" });
    if (name.length > 80)
      details.push({ field: "name", code: "TOO_LONG", params: { max: 80 } });
    if (tags.length < 1) details.push({ field: "tags", code: "REQUIRED" });
    if (tags.length > 30)
      details.push({ field: "tags", code: "TOO_MANY", params: { max: 30 } });
    for (const tag of tags) {
      if (tag.length > 50 || !TAG_PATTERN.test(tag))
        details.push({
          field: "tags",
          code: tag.length > 50 ? "TOO_LONG" : "INVALID_FORMAT",
          params: tag.length > 50 ? { max: 50 } : undefined,
        });
    }
    if (details.length)
      throw new BadRequestException(
        apiError("VALIDATION_ERROR", "Request validation failed", details)
      );
    return {
      name,
      normalizedName: this.normalizeKey(name),
      tags,
      tagCount: tags.length,
      searchText: this.normalizeKey(`${name} ${tags.join(" ")}`),
    };
  }
  private shape(group: {
    id: string;
    name: string;
    tags: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...group,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  }
  private conflict(error: unknown): never {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    )
      throw new ConflictException(
        apiError(
          "TAG_GROUP_NAME_CONFLICT",
          "A tag group with this name already exists"
        )
      );
    throw error;
  }

  async list(userId: string, workspaceId: string, query: TagGroupsQueryDto) {
    await this.access.requireMembership(userId, workspaceId);
    const search = this.normalizeKey(query.query?.trim() ?? "");
    const where = {
      workspaceId,
      ...(search ? { searchText: { contains: search } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.tagGroup.findMany({
        where,
        orderBy: [{ [query.sortBy]: query.sortDirection }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.tagGroup.count({ where }),
    ]);
    return {
      items: items.map((item) => this.shape(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async lookup(
    userId: string,
    workspaceId: string,
    query: TagGroupsLookupQueryDto
  ) {
    await this.access.requireMembership(userId, workspaceId);
    const includeIds = [
      ...new Set(
        (query.includeIds ?? "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      ),
    ];
    if (includeIds.length > 50)
      throw new BadRequestException(
        apiError("VALIDATION_ERROR", "Request validation failed", [
          { field: "includeIds", code: "TOO_MANY", params: { max: 50 } },
        ])
      );
    const search = this.normalizeKey(query.query?.trim() ?? "");
    const [options, existing] = await this.prisma.$transaction([
      this.prisma.tagGroup.findMany({
        where: {
          workspaceId,
          ...(search ? { searchText: { contains: search } } : {}),
        },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        take: query.limit,
      }),
      this.prisma.tagGroup.findMany({
        where: { workspaceId, id: { in: includeIds } },
        select: { id: true },
      }),
    ]);
    return {
      options: options.map((item) => this.shape(item)),
      existingIds: existing.map((item) => item.id),
    };
  }

  async create(userId: string, workspaceId: string, input: TagGroupBodyDto) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    const data = this.validation(input);
    try {
      return this.shape(
        await this.prisma.tagGroup.create({
          data: { ...data, workspaceId, createdBy: userId },
        })
      );
    } catch (error) {
      return this.conflict(error);
    }
  }

  async update(
    userId: string,
    workspaceId: string,
    id: string,
    input: TagGroupBodyDto
  ) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    const existing = await this.prisma.tagGroup.findFirst({
      where: { id, workspaceId },
    });
    if (!existing)
      throw new NotFoundException(
        apiError("TAG_GROUP_NOT_FOUND", "Tag group not found")
      );
    try {
      return this.shape(
        await this.prisma.tagGroup.update({
          where: { id },
          data: this.validation(input),
        })
      );
    } catch (error) {
      return this.conflict(error);
    }
  }

  async delete(userId: string, workspaceId: string, id: string) {
    await this.access.requireRole(userId, workspaceId, [...MANAGE_ROLES]);
    const result = await this.prisma.tagGroup.deleteMany({
      where: { id, workspaceId },
    });
    if (!result.count)
      throw new NotFoundException(
        apiError("TAG_GROUP_NOT_FOUND", "Tag group not found")
      );
  }
}
