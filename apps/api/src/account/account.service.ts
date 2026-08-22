import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import * as argon2 from "argon2";

import { EmailChallengeService } from "../auth/email-challenge.service.js";
import { apiError } from "../common/api-error.js";
import { PrismaService } from "../infrastructure/prisma.service.js";
import { RedisService } from "../infrastructure/redis.service.js";

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly challenges: EmailChallengeService
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
  private async enforce(scope: string, userId: string) {
    if (!(await this.redis.assertLimit(scope, userId, 5, 60)))
      throw new HttpException(
        apiError("RATE_LIMITED", "Too many attempts"),
        HttpStatus.TOO_MANY_REQUESTS
      );
  }
  private async identity(userId: string) {
    const identity = await this.prisma.identity.findFirst({
      where: { userId },
      include: { credential: true },
      orderBy: { id: "asc" },
    });
    if (!identity)
      throw new UnauthorizedException(
        apiError("UNAUTHENTICATED", "Authentication required")
      );
    return identity;
  }
  private async requirePasswordIdentity(userId: string) {
    const identity = await this.identity(userId);
    if (identity.provider !== "password")
      throw new ForbiddenException(
        apiError(
          "ACCOUNT_PROVIDER_RESTRICTED",
          "This operation is not available for this provider"
        )
      );
    return identity;
  }
  private async publicUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const identity = await this.identity(userId);
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

  async updateProfile(userId: string, name: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });
    return this.publicUser(userId);
  }
  async startEmailChange(userId: string, rawEmail: string) {
    await this.requirePasswordIdentity(userId);
    await this.enforce("account-email-change", userId);
    const newEmail = this.normalizeEmail(rawEmail);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (newEmail === user.email)
      throw new BadRequestException(
        apiError("EMAIL_UNCHANGED", "Email must be different")
      );
    if (await this.prisma.user.findUnique({ where: { email: newEmail } }))
      throw new ConflictException(
        apiError("EMAIL_ALREADY_REGISTERED", "Email is already registered")
      );
    return this.challenges.issue({
      purpose: "email_change",
      email: newEmail,
      userId,
    });
  }
  async verifyEmailChange(
    userId: string,
    sessionId: string,
    challengeId: string,
    code: string
  ) {
    await this.requirePasswordIdentity(userId);
    await this.enforce("account-email-verify", userId);
    const challenge = await this.challenges.validate(
      challengeId,
      code,
      "email_change",
      userId
    );
    if (
      await this.prisma.user.findFirst({
        where: { email: challenge.email, NOT: { id: userId } },
      })
    )
      throw new ConflictException(
        apiError("EMAIL_ALREADY_REGISTERED", "Email is already registered")
      );
    const now = new Date();
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { email: challenge.email },
        });
        await tx.emailChallenge.update({
          where: { id: challengeId },
          data: { consumedAt: now },
        });
        await tx.session.updateMany({
          where: { userId, id: { not: sessionId }, revokedAt: null },
          data: { revokedAt: now },
        });
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        error.code === "P2002"
      )
        throw new ConflictException(
          apiError("EMAIL_ALREADY_REGISTERED", "Email is already registered")
        );
      throw error;
    }
    return this.publicUser(userId);
  }
  async resendEmailChange(userId: string, challengeId: string) {
    await this.requirePasswordIdentity(userId);
    await this.enforce("account-email-resend", userId);
    return this.challenges.resend(challengeId, userId);
  }
  async changePassword(
    userId: string,
    sessionId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const identity = await this.requirePasswordIdentity(userId);
    await this.enforce("account-password-change", userId);
    if (
      !identity.credential ||
      !(await argon2.verify(identity.credential.passwordHash, currentPassword))
    )
      throw new UnauthorizedException(
        apiError("INVALID_CREDENTIALS", "Current password is invalid")
      );
    if (await argon2.verify(identity.credential.passwordHash, newPassword))
      throw new BadRequestException(
        apiError("PASSWORD_UNCHANGED", "New password must be different")
      );
    const now = new Date();
    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordCredential.update({
        where: { identityId: identity.id },
        data: { passwordHash },
      });
      await tx.session.updateMany({
        where: { userId, id: { not: sessionId }, revokedAt: null },
        data: { revokedAt: now },
      });
    });
  }
}
