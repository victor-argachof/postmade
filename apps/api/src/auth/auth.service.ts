import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import * as argon2 from "argon2";

import type { User } from "../generated/prisma/client.js";
import { MailService } from "../infrastructure/mail.service.js";
import { PrismaService } from "../infrastructure/prisma.service.js";
import { RedisService } from "../infrastructure/redis.service.js";

const CHALLENGE_MS = 10 * 60_000;
const RESEND_MS = 60_000;
const SESSION_MS = 30 * 24 * 60 * 60_000;
const MAX_ATTEMPTS = 5;
type ChallengePurpose = "register" | "login" | "password_reset";
export type SafeUser = ReturnType<AuthService["toSafeUser"]>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mail: MailService
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
        { code: "RATE_LIMITED", message: "Too many attempts; try again later" },
        HttpStatus.TOO_MANY_REQUESTS
      );
  }
  private async issueChallenge(input: {
    purpose: ChallengePurpose;
    email: string;
    userId?: string;
    pendingName?: string;
    pendingPassword?: string;
    pendingTimezone?: string;
    send?: boolean;
  }) {
    const id = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CHALLENGE_MS);
    await this.prisma.emailChallenge.create({
      data: {
        id,
        purpose: input.purpose,
        email: input.email,
        userId: input.userId ?? null,
        pendingName: input.pendingName ?? null,
        pendingPassword: input.pendingPassword ?? null,
        pendingTimezone: input.pendingTimezone ?? null,
        codeHash: this.digest(`${id}:${code}`),
        expiresAt,
        lastSentAt: now,
      },
    });
    if (input.send !== false)
      await this.mail.sendCode(input.email, code, input.purpose);
    return {
      challengeId: id,
      expiresAt: expiresAt.toISOString(),
      resendAvailableAt: new Date(now.getTime() + RESEND_MS).toISOString(),
    };
  }
  async startRegistration(
    name: string,
    rawEmail: string,
    password: string,
    timezone = "UTC"
  ) {
    const email = this.normalizeEmail(rawEmail);
    await this.enforce("register", email);
    if (await this.prisma.user.findUnique({ where: { email } }))
      throw new BadRequestException({
        code: "EMAIL_ALREADY_REGISTERED",
        message: "Email is already registered",
      });
    try {
      new Intl.DateTimeFormat("en", { timeZone: timezone });
    } catch {
      timezone = "UTC";
    }
    return this.issueChallenge({
      purpose: "register",
      email,
      pendingName: name.trim(),
      pendingPassword: await argon2.hash(password),
      pendingTimezone: timezone,
    });
  }
  async startLogin(rawEmail: string, password: string) {
    const email = this.normalizeEmail(rawEmail);
    await this.enforce("login", email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const identity = user
      ? await this.prisma.identity.findUnique({
          where: { userId_provider: { userId: user.id, provider: "password" } },
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
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    return this.issueChallenge({ purpose: "login", email, userId: user.id });
  }
  async forgotPassword(rawEmail: string) {
    const email = this.normalizeEmail(rawEmail);
    await this.enforce("password-reset", email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    return this.issueChallenge({
      purpose: "password_reset",
      email,
      userId: user?.id,
      send: Boolean(user),
    });
  }
  private async validateChallenge(
    id: string,
    code: string,
    purpose: ChallengePurpose
  ) {
    const challenge = await this.prisma.emailChallenge.findUnique({
      where: { id },
    });
    if (
      !challenge ||
      challenge.purpose !== purpose ||
      challenge.consumedAt ||
      challenge.expiresAt <= new Date() ||
      challenge.attempts >= MAX_ATTEMPTS
    )
      throw new BadRequestException({
        code: "INVALID_CHALLENGE",
        message: "Challenge is invalid or expired",
      });
    if (challenge.codeHash !== this.digest(`${id}:${code}`)) {
      await this.prisma.emailChallenge.update({
        where: { id },
        data: { attempts: challenge.attempts + 1 },
      });
      throw new BadRequestException({
        code: "INVALID_CODE",
        message: "Verification code is invalid",
      });
    }
    return challenge;
  }
  async verifyRegistration(id: string, code: string) {
    const challenge = await this.validateChallenge(id, code, "register");
    if (!challenge.pendingName || !challenge.pendingPassword)
      throw new BadRequestException({
        code: "INVALID_CHALLENGE",
        message: "Challenge is invalid",
      });
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
      await tx.emailChallenge.update({
        where: { id },
        data: { consumedAt: now },
      });
      return created;
    });
    return this.createSession(user);
  }
  async verifyLogin(id: string, code: string) {
    const challenge = await this.validateChallenge(id, code, "login");
    const user = challenge.userId
      ? await this.prisma.user.findUnique({ where: { id: challenge.userId } })
      : null;
    if (!user)
      throw new BadRequestException({
        code: "INVALID_CHALLENGE",
        message: "Challenge is invalid",
      });
    await this.prisma.emailChallenge.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
    return this.createSession(user);
  }
  async resetPassword(id: string, code: string, password: string) {
    const challenge = await this.validateChallenge(id, code, "password_reset");
    if (!challenge.userId)
      throw new BadRequestException({
        code: "INVALID_CHALLENGE",
        message: "Challenge is invalid",
      });
    const identity = await this.prisma.identity.findUnique({
      where: {
        userId_provider: { userId: challenge.userId, provider: "password" },
      },
    });
    if (!identity)
      throw new BadRequestException({
        code: "INVALID_CHALLENGE",
        message: "Challenge is invalid",
      });
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
    const challenge = await this.prisma.emailChallenge.findUnique({
      where: { id },
    });
    const now = new Date();
    if (!challenge || challenge.consumedAt || challenge.expiresAt <= now)
      throw new BadRequestException({
        code: "INVALID_CHALLENGE",
        message: "Challenge is invalid or expired",
      });
    if (challenge.lastSentAt.getTime() + RESEND_MS > now.getTime())
      throw new HttpException(
        {
          code: "RESEND_COOLDOWN",
          message: "Wait before requesting another code",
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const expiresAt = new Date(now.getTime() + CHALLENGE_MS);
    await this.prisma.emailChallenge.update({
      where: { id },
      data: {
        codeHash: this.digest(`${id}:${code}`),
        attempts: 0,
        expiresAt,
        lastSentAt: now,
      },
    });
    await this.mail.sendCode(challenge.email, code, challenge.purpose);
    return {
      challengeId: id,
      expiresAt: expiresAt.toISOString(),
      resendAvailableAt: new Date(now.getTime() + RESEND_MS).toISOString(),
    };
  }
  private async createSession(user: User) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_MS);
    await this.prisma.session.create({
      data: { userId: user.id, tokenHash: this.digest(token), expiresAt },
    });
    return { token, expiresAt, user: this.toSafeUser(user) };
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
    return user ? { sessionId: session.id, user: this.toSafeUser(user) } : null;
  }
  async logout(sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  toSafeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      identity: { provider: "password" as const, emailVerified: true },
      createdAt: user.createdAt.toISOString(),
    };
  }
}
