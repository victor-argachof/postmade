import { ForbiddenException, Injectable } from "@nestjs/common";

import { apiError } from "../common/api-error.js";
import { PrismaService } from "../infrastructure/prisma.service.js";
import { WorkspaceAccessService } from "./workspace-access.service.js";
import { UpdateWorkspaceDto } from "./workspaces.dto.js";

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService
  ) {}
  private shape(
    member: Awaited<ReturnType<WorkspaceAccessService["requireMembership"]>>
  ) {
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
  async list(userId: string) {
    const items = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { joinedAt: "asc" },
    });
    return items.map((item) => this.shape(item));
  }
  async get(userId: string, id: string) {
    return this.shape(await this.access.requireMembership(userId, id));
  }
  async update(userId: string, id: string, input: UpdateWorkspaceDto) {
    const member = await this.access.requireMembership(userId, id);
    if (member.role !== "owner" && member.role !== "admin")
      throw new ForbiddenException(
        apiError("WORKSPACE_FORBIDDEN", "Insufficient workspace permission")
      );
    if (input.timezone) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: input.timezone });
      } catch {
        throw new ForbiddenException(
          apiError("INVALID_TIMEZONE", "Timezone must be a valid IANA timezone")
        );
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
