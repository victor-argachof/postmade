import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../infrastructure/prisma.service.js";
import { UpdateWorkspaceDto } from "./workspaces.dto.js";

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}
  private shape(member: Awaited<ReturnType<WorkspacesService["membership"]>>) {
    if (!member)
      throw new NotFoundException({
        code: "WORKSPACE_NOT_FOUND",
        message: "Workspace not found",
      });
    const w = member.workspace;
    return {
      id: w.id,
      name: w.name,
      ownerId: w.ownerId,
      timezone: w.timezone,
      role: member.role,
      subscriptionStatus: w.subscriptionStatus,
      subscriptionConfiguration: {
        channels: w.subscriptionChannels,
        members: w.subscriptionMembers,
      },
      trialStartedAt: w.trialStartedAt.toISOString(),
      trialEndsAt: w.trialEndsAt.toISOString(),
      createdAt: w.createdAt.toISOString(),
    };
  }
  private membership(userId: string, workspaceId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: true },
    });
  }
  async list(userId: string) {
    const items = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { joinedAt: "asc" },
    });
    return items.map((item) => this.shape(item));
  }
  async get(userId: string, id: string) {
    return this.shape(await this.membership(userId, id));
  }
  async update(userId: string, id: string, input: UpdateWorkspaceDto) {
    const member = await this.membership(userId, id);
    if (!member)
      throw new NotFoundException({
        code: "WORKSPACE_NOT_FOUND",
        message: "Workspace not found",
      });
    if (member.role !== "owner" && member.role !== "admin")
      throw new ForbiddenException({
        code: "WORKSPACE_FORBIDDEN",
        message: "Insufficient workspace permission",
      });
    if (input.timezone) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: input.timezone });
      } catch {
        throw new ForbiddenException({
          code: "INVALID_TIMEZONE",
          message: "Timezone must be a valid IANA timezone",
        });
      }
    }
    await this.prisma.workspace.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.timezone ? { timezone: input.timezone } : {}),
      },
    });
    return this.get(userId, id);
  }
}
