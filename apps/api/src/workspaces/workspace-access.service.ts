import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { apiError } from "../common/api-error.js";
import type { WorkspaceRole } from "../generated/prisma/client.js";
import { PrismaService } from "../infrastructure/prisma.service.js";

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMembership(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: true },
    });
    if (!membership)
      throw new NotFoundException(
        apiError("WORKSPACE_NOT_FOUND", "Workspace not found")
      );
    return membership;
  }

  async requireRole(
    userId: string,
    workspaceId: string,
    roles: WorkspaceRole[]
  ) {
    const membership = await this.requireMembership(userId, workspaceId);
    if (!roles.includes(membership.role))
      throw new ForbiddenException(
        apiError("WORKSPACE_FORBIDDEN", "Insufficient workspace permission")
      );
    return membership;
  }
}
