import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import * as argon2 from "argon2";

import { apiError } from "../common/api-error.js";
import type { User } from "../generated/prisma/client.js";
import { PrismaService } from "../infrastructure/prisma.service.js";
import { RedisService } from "../infrastructure/redis.service.js";
import { hashInvitationToken } from "../workspaces/invitation-token.js";
import { EmailChallengeService } from "./email-challenge.service.js";

const SESSION_MS = 30 * 24 * 60 * 60_000;

export type SafeUser = Awaited<ReturnType<AuthService["toSafeUser"]>>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly challenges: EmailChallengeService
  ) {}
  normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
  private digest(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
  private async enforce(scope: string, identifier: string) {
    if (!(await this.redis.assertLimit(scope, identifier, 5, 60)))
      throw new HttpException(
        apiError("RATE_LIMITED", "Too many attempts; try again later"),
        HttpStatus.TOO_MANY_REQUESTS
      );
  }
  async startRegistration(
    name: string,
    rawEmail: string,
    password: string,
    timezone = "UTC",
    invitationToken?: string
  ) {
    const email = this.normalizeEmail(rawEmail);
    await this.enforce("register", email);
    if (await this.prisma.user.findUnique({ where: { email } }))
      throw new BadRequestException(
        apiError("EMAIL_ALREADY_REGISTERED", "Email is already registered")
      );
    try {
      new Intl.DateTimeFormat("en", { timeZone: timezone });
    } catch {
      timezone = "UTC";
    }
    let pendingInvitationId: string | undefined;
    if (invitationToken) {
      const invitation = await this.prisma.workspaceInvitation.findUnique({
        where: { tokenHash: hashInvitationToken(invitationToken) },
      });
      if (!invitation)
        throw new BadRequestException(
          apiError("INVITATION_INVALID", "Invitation is invalid")
        );
      if (invitation.status === "accepted")
        throw new BadRequestException(
          apiError("INVITATION_ALREADY_ACCEPTED", "Invitation already accepted")
        );
      if (invitation.status === "revoked")
        throw new BadRequestException(
          apiError("INVITATION_REVOKED", "Invitation revoked")
        );
      if (invitation.expiresAt <= new Date())
        throw new BadRequestException(
          apiError("INVITATION_EXPIRED", "Invitation expired")
        );
      if (invitation.email !== email)
        throw new BadRequestException(
          apiError(
            "INVITATION_EMAIL_MISMATCH",
            "Invitation email does not match"
          )
        );
      pendingInvitationId = invitation.id;
    }
    return this.challenges.issue({
      purpose: "register",
      email,
      pendingName: name.trim(),
      pendingPassword: await argon2.hash(password),
      pendingTimezone: timezone,
      pendingInvitationId,
    });
  }
  async startLogin(rawEmail: string, password: string) {
    const email = this.normalizeEmail(rawEmail);
    await this.enforce("login", email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const identity = user
      ? await this.prisma.identity.findFirst({
          where: { userId: user.id, provider: "password" },
        })
      : null;
    const credential = identity
      ? await this.prisma.passwordCredential.findUnique({
          where: { identityId: identity.id },
        })
      : null;
    if (
      !user ||
      !credential ||
      !(await argon2.verify(credential.passwordHash, password))
    )
      throw new UnauthorizedException(
        apiError("INVALID_CREDENTIALS", "Invalid email or password")
      );
    return this.challenges.issue({ purpose: "login", email, userId: user.id });
  }
  async forgotPassword(rawEmail: string) {
    const email = this.normalizeEmail(rawEmail);
    await this.enforce("password-reset", email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    return this.challenges.issue({
      purpose: "password_reset",
      email,
      userId: user?.id,
      send: Boolean(user),
    });
  }
  async verifyRegistration(id: string, code: string) {
    const challenge = await this.challenges.validate(id, code, "register");
    if (!challenge.pendingName || !challenge.pendingPassword)
      throw new BadRequestException(
        apiError("INVALID_CHALLENGE", "Challenge is invalid")
      );
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 15 * 24 * 60 * 60_000);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: challenge.pendingName!,
          email: challenge.email,
        },
      });
      const identity = await tx.identity.create({
        data: {
          userId: created.id,
          provider: "password",
          providerSubject: `password:${randomUUID()}`,
          emailVerified: true,
        },
      });
      await tx.passwordCredential.create({
        data: {
          identityId: identity.id,
          passwordHash: challenge.pendingPassword!,
        },
      });
      if (!challenge.pendingInvitationId) {
        const workspace = await tx.workspace.create({
          data: {
            name: `Workspace de ${created.name}`,
            ownerId: created.id,
            timezone: challenge.pendingTimezone ?? "UTC",
            trialStartedAt: now,
            trialEndsAt,
          },
        });
        await tx.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: created.id,
            role: "owner",
          },
        });
      }
      await tx.emailChallenge.update({
        where: { id },
        data: { consumedAt: now },
      });
      return created;
    });
    return this.createSession(user);
  }
  async verifyLogin(id: string, code: string) {
    const challenge = await this.challenges.validate(id, code, "login");
    const user = challenge.userId
      ? await this.prisma.user.findUnique({ where: { id: challenge.userId } })
      : null;
    if (!user)
      throw new BadRequestException(
        apiError("INVALID_CHALLENGE", "Challenge is invalid")
      );
    await this.prisma.emailChallenge.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
    return this.createSession(user);
  }
  async resetPassword(id: string, code: string, password: string) {
    const challenge = await this.challenges.validate(
      id,
      code,
      "password_reset"
    );
    if (!challenge.userId)
      throw new BadRequestException(
        apiError("INVALID_CHALLENGE", "Challenge is invalid")
      );
    const identity = await this.prisma.identity.findFirst({
      where: { userId: challenge.userId, provider: "password" },
    });
    if (!identity)
      throw new BadRequestException(
        apiError("INVALID_CHALLENGE", "Challenge is invalid")
      );
    const passwordHash = await argon2.hash(password);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordCredential.update({
        where: { identityId: identity.id },
        data: { passwordHash },
      });
      await tx.emailChallenge.update({
        where: { id },
        data: { consumedAt: now },
      });
      await tx.session.updateMany({
        where: { userId: challenge.userId!, revokedAt: null },
        data: { revokedAt: now },
      });
    });
  }
  async resend(id: string) {
    return this.challenges.resend(id);
  }
  private async createSession(user: User) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_MS);
    await this.prisma.session.create({
      data: { userId: user.id, tokenHash: this.digest(token), expiresAt },
    });
    return { token, expiresAt, user: await this.toSafeUser(user) };
  }
  async authenticate(token?: string) {
    if (!token) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.digest(token) },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date())
      return null;
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });
    return user
      ? { sessionId: session.id, user: await this.toSafeUser(user) }
      : null;
  }
  async logout(sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  async toSafeUser(user: User) {
    const identity = await this.prisma.identity.findFirst({
      where: { userId: user.id },
      orderBy: { id: "asc" },
    });
    if (!identity) return null as never;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      identity: {
        provider: identity.provider,
        emailVerified: identity.emailVerified,
      },
      createdAt: user.createdAt.toISOString(),
    };
  }
}
