import { Module } from "@nestjs/common";

import { AuthController } from "./auth.controller.js";
import { SessionGuard } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";
import { EmailChallengeService } from "./email-challenge.service.js";

@Module({
  controllers: [AuthController],
  providers: [AuthService, EmailChallengeService, SessionGuard],
  exports: [AuthService, EmailChallengeService, SessionGuard],
})
export class AuthModule {}
