import { randomBytes } from "node:crypto";
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { apiError } from "../common/api-error.js";
import type { WorkspaceRole } from "../generated/prisma/client.js";
import { MailService } from "../infrastructure/mail.service.js";
import { PrismaService } from "../infrastructure/prisma.service.js";
import { hashInvitationToken } from "./invitation-token.js";
import { WorkspaceAccessService } from "./workspace-access.service.js";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60_000;
type AssignableRole = Exclude<WorkspaceRole, "owner">;

@Injectable()
export class WorkspaceMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly mail: MailService,
    private readonly config: ConfigService
  ) {}

  private status(invitation: { status: string; expiresAt: Date }) {
    return invitation.status === "pending" && invitation.expiresAt <= new Date()
      ? "expired"
      : invitation.status;
  }
  private shapeInvitation(invitation: any, token?: string) {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: this.status(invitation),
      invitedBy: { id: invitation.sender.id, name: invitation.sender.name },
      invitedAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
      ...(token
        ? {
            invitationUrl: `${this.config.getOrThrow<string>("WEB_APP_URL")}/invitation?token=${encodeURIComponent(token)}`,
          }
        : {}),
    };
  }
  private assertCanManage(actorRole: WorkspaceRole, targetRole: WorkspaceRole) {
    if (actorRole === "owner" && targetRole !== "owner") return;
    if (
      actorRole === "admin" &&
      (targetRole === "editor" || targetRole === "viewer")
    )
      return;
    throw new ForbiddenException(
      apiError("WORKSPACE_FORBIDDEN", "Insufficient workspace permission")
    );
  }
  private async assertCapacity(tx: any, workspaceId: string) {
    const workspace = await tx.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });
    if (workspace.subscriptionStatus === "trialing")
      throw new ConflictException(
        apiError("WORKSPACE_MEMBER_LIMIT_REACHED", "Member limit reached")
      );
    const [members, invitations] = await Promise.all([
      tx.workspaceMember.count({ where: { workspaceId } }),
      tx.workspaceInvitation.count({
        where: {
          workspaceId,
          status: "pending",
          expiresAt: { gt: new Date() },
        },
      }),
    ]);
    if (members + invitations >= workspace.subscriptionMembers)
      throw new ConflictException(
        apiError("WORKSPACE_MEMBER_LIMIT_REACHED", "Member limit reached")
      );
  }
  async listMembers(userId: string, workspaceId: string) {
    await this.access.requireMembership(userId, workspaceId);
    const items = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    });
    return items.map((item) => ({
      id: item.userId,
      name: item.user.name,
      email: item.user.email,
      role: item.role,
      joinedAt: item.joinedAt.toISOString(),
    }));
  }
  async listInvitations(userId: string, workspaceId: string) {
    const actor = await this.access.requireMembership(userId, workspaceId);
    if (actor.role !== "owner" && actor.role !== "admin") return [];
    const items = await this.prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      include: { sender: true },
      orderBy: { createdAt: "desc" },
    });
    return items.map((item) => this.shapeInvitation(item));
  }
  async create(
    userId: string,
    workspaceId: string,
    emailInput: string,
    role: AssignableRole
  ) {
    const actor = await this.access.requireMembership(userId, workspaceId);
    this.assertCanManage(actor.role, role);
    const email = emailInput.trim().toLowerCase();
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    const invitation = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        workspaceId
      );
      await this.assertCapacity(tx, workspaceId);
      const member = await tx.workspaceMember.findFirst({
        where: { workspaceId, user: { email } },
      });
      if (member)
        throw new ConflictException(
          apiError("WORKSPACE_MEMBER_EXISTS", "User is already a member")
        );
      const duplicate = await tx.workspaceInvitation.findFirst({
        where: {
          workspaceId,
          email,
          status: "pending",
          expiresAt: { gt: new Date() },
        },
      });
      if (duplicate)
        throw new ConflictException(
          apiError("INVITATION_DUPLICATE", "Invitation already exists")
        );
      return tx.workspaceInvitation.create({
        data: {
          workspaceId,
          email,
          role,
          tokenHash: hashInvitationToken(token),
          invitedBy: userId,
          expiresAt,
        },
        include: { sender: true, workspace: true },
      });
    });
    const shaped = this.shapeInvitation(invitation, token);
    try {
      await this.mail.sendWorkspaceInvitation({
        email,
        workspaceName: invitation.workspace.name,
        inviterName: invitation.sender.name,
        role,
        expiresAt,
        url: shaped.invitationUrl!,
      });
    } catch {
      throw new ServiceUnavailableException(
        apiError(
          "INVITATION_EMAIL_FAILED",
          "Invitation saved but email delivery failed"
        )
      );
    }
    return shaped;
  }
  async resend(userId: string, workspaceId: string, id: string) {
    const actor = await this.access.requireMembership(userId, workspaceId);
    const current = await this.prisma.workspaceInvitation.findFirst({
      where: { id, workspaceId },
      include: { sender: true },
    });
    if (!current)
      throw new NotFoundException(
        apiError("INVITATION_INVALID", "Invitation not found")
      );
    this.assertCanManage(actor.role, current.role);
    if (current.status === "accepted")
      throw new ConflictException(
        apiError("INVITATION_ALREADY_ACCEPTED", "Invitation already accepted")
      );
    if (current.status === "revoked")
      throw new ConflictException(
        apiError("INVITATION_REVOKED", "Invitation revoked")
      );
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        workspaceId
      );
      if (current.expiresAt <= new Date())
        await this.assertCapacity(tx, workspaceId);
      return tx.workspaceInvitation.update({
        where: { id },
        data: { tokenHash: hashInvitationToken(token), expiresAt },
        include: { sender: true, workspace: true },
      });
    });
    const shaped = this.shapeInvitation(updated, token);
    try {
      await this.mail.sendWorkspaceInvitation({
        email: updated.email,
        workspaceName: updated.workspace.name,
        inviterName: updated.sender.name,
        role: updated.role,
        expiresAt,
        url: shaped.invitationUrl!,
      });
    } catch {
      throw new ServiceUnavailableException(
        apiError(
          "INVITATION_EMAIL_FAILED",
          "Invitation saved but email delivery failed"
        )
      );
    }
    return shaped;
  }
  async revoke(userId: string, workspaceId: string, id: string) {
    const actor = await this.access.requireMembership(userId, workspaceId);
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: { id, workspaceId },
    });
    if (!invitation)
      throw new NotFoundException(
        apiError("INVITATION_INVALID", "Invitation not found")
      );
    this.assertCanManage(actor.role, invitation.role);
    await this.prisma.workspaceInvitation.update({
      where: { id },
      data: { status: "revoked", revokedAt: new Date() },
    });
  }
  async details(token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { tokenHash: hashInvitationToken(token) },
      include: { workspace: true, sender: true },
    });
    if (!invitation)
      throw new NotFoundException(
        apiError("INVITATION_INVALID", "Invitation is invalid")
      );
    return {
      workspaceName: invitation.workspace.name,
      email: invitation.email,
      role: invitation.role,
      invitedByName: invitation.sender.name,
      expiresAt: invitation.expiresAt.toISOString(),
      status: this.status(invitation),
    };
  }
  async accept(userId: string, userEmail: string, token: string) {
    const tokenHash = hashInvitationToken(token);
    return this.prisma.$transaction(async (tx) => {
      const initial = await tx.workspaceInvitation.findUnique({
        where: { tokenHash },
      });
      if (!initial)
        throw new NotFoundException(
          apiError("INVITATION_INVALID", "Invitation is invalid")
        );
      await tx.$executeRawUnsafe(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        initial.workspaceId
      );
      const invitation = await tx.workspaceInvitation.findUnique({
        where: { id: initial.id },
      });
      if (!invitation)
        throw new NotFoundException(
          apiError("INVITATION_INVALID", "Invitation is invalid")
        );
      if (invitation.status === "accepted")
        throw new ConflictException(
          apiError("INVITATION_ALREADY_ACCEPTED", "Invitation already accepted")
        );
      if (invitation.status === "revoked")
        throw new ConflictException(
          apiError("INVITATION_REVOKED", "Invitation revoked")
        );
      if (invitation.expiresAt <= new Date())
        throw new ConflictException(
          apiError("INVITATION_EXPIRED", "Invitation expired")
        );
      if (invitation.email !== userEmail.toLowerCase())
        throw new ForbiddenException(
          apiError(
            "INVITATION_EMAIL_MISMATCH",
            "Invitation email does not match"
          )
        );
      const existing = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: invitation.workspaceId, userId },
        },
      });
      if (!existing) {
        // The pending invitation already occupies one slot, so only member usage is checked here.
        const workspace = await tx.workspace.findUniqueOrThrow({
          where: { id: invitation.workspaceId },
        });
        const members = await tx.workspaceMember.count({
          where: { workspaceId: invitation.workspaceId },
        });
        if (
          workspace.subscriptionStatus === "trialing" ||
          members >= workspace.subscriptionMembers
        )
          throw new ConflictException(
            apiError("WORKSPACE_MEMBER_LIMIT_REACHED", "Member limit reached")
          );
        await tx.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId,
            role: invitation.role,
          },
        });
      }
      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted", acceptedAt: new Date() },
      });
      return { workspaceId: invitation.workspaceId };
    });
  }
  async updateRole(
    userId: string,
    workspaceId: string,
    memberId: string,
    role: AssignableRole
  ) {
    if (userId === memberId)
      throw new ForbiddenException(
        apiError("WORKSPACE_FORBIDDEN", "Cannot change own role")
      );
    const actor = await this.access.requireMembership(userId, workspaceId);
    const target = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberId } },
    });
    if (!target)
      throw new NotFoundException(
        apiError("WORKSPACE_MEMBER_NOT_FOUND", "Member not found")
      );
    this.assertCanManage(actor.role, target.role);
    this.assertCanManage(actor.role, role);
    await this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: memberId } },
      data: { role },
    });
    return this.listMembers(userId, workspaceId);
  }
  async remove(userId: string, workspaceId: string, memberId: string) {
    if (userId === memberId)
      throw new ForbiddenException(
        apiError("WORKSPACE_FORBIDDEN", "Cannot remove self")
      );
    const actor = await this.access.requireMembership(userId, workspaceId);
    const target = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberId } },
    });
    if (!target)
      throw new NotFoundException(
        apiError("WORKSPACE_MEMBER_NOT_FOUND", "Member not found")
      );
    this.assertCanManage(actor.role, target.role);
    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: memberId } },
    });
  }
}
