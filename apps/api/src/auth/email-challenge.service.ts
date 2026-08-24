import { createHash, randomInt, randomUUID } from "node:crypto";
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";

import { apiError } from "../common/api-error.js";
import type { ChallengePurpose } from "../generated/prisma/client.js";
import { MailService } from "../infrastructure/mail.service.js";
import { PrismaService } from "../infrastructure/prisma.service.js";

const CHALLENGE_MS = 10 * 60_000;
const RESEND_MS = 60_000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class EmailChallengeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService
  ) {}

  private digest(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }

  async issue(input: {
    purpose: ChallengePurpose;
    email: string;
    userId?: string;
    pendingName?: string;
    pendingPassword?: string;
    pendingTimezone?: string;
    pendingInvitationId?: string;
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
        pendingInvitationId: input.pendingInvitationId ?? null,
        codeHash: this.digest(`${id}:${code}`),
        expiresAt,
        lastSentAt: now,
      },
    });
    if (input.send !== false)
      await this.mail.sendCode(input.email, code, input.purpose);
    return this.response(id, now, expiresAt);
  }

  async validate(
    id: string,
    code: string,
    purpose: ChallengePurpose,
    expectedUserId?: string
  ) {
    const challenge = await this.prisma.emailChallenge.findUnique({
      where: { id },
    });
    if (
      !challenge ||
      challenge.purpose !== purpose ||
      challenge.consumedAt ||
      challenge.expiresAt <= new Date() ||
      challenge.attempts >= MAX_ATTEMPTS ||
      (expectedUserId !== undefined && challenge.userId !== expectedUserId)
    )
      throw new BadRequestException(
        apiError("INVALID_CHALLENGE", "Challenge is invalid or expired")
      );
    if (challenge.codeHash !== this.digest(`${id}:${code}`)) {
      await this.prisma.emailChallenge.update({
        where: { id },
        data: { attempts: challenge.attempts + 1 },
      });
      throw new BadRequestException(
        apiError("INVALID_CODE", "Verification code is invalid")
      );
    }
    return challenge;
  }

  async resend(id: string, expectedUserId?: string) {
    const challenge = await this.prisma.emailChallenge.findUnique({
      where: { id },
    });
    const now = new Date();
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt <= now ||
      (expectedUserId !== undefined && challenge.userId !== expectedUserId)
    )
      throw new BadRequestException(
        apiError("INVALID_CHALLENGE", "Challenge is invalid or expired")
      );
    if (challenge.lastSentAt.getTime() + RESEND_MS > now.getTime())
      throw new HttpException(
        apiError("RESEND_COOLDOWN", "Wait before requesting another code"),
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
    return this.response(id, now, expiresAt);
  }

  private response(challengeId: string, now: Date, expiresAt: Date) {
    return {
      challengeId,
      expiresAt: expiresAt.toISOString(),
      resendAvailableAt: new Date(now.getTime() + RESEND_MS).toISOString(),
    };
  }
}
