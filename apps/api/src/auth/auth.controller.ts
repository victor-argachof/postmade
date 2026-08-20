import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Response } from "express";

import { ApiErrorDto } from "../common/api-error.dto.js";
import {
  ChallengeResponseDto,
  ForgotPasswordDto,
  LoginStartDto,
  RegisterStartDto,
  ResendCodeDto,
  ResetPasswordDto,
  UserResponseDto,
  VerifyChallengeDto,
} from "./auth.dto.js";
import {
  CurrentUser,
  SessionGuard,
  type AuthenticatedRequest,
} from "./auth.guard.js";
import { AuthService, type SafeUser } from "./auth.service.js";

const cookieOptions = (secure: boolean, expires: Date) => ({
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
  expires,
});
@ApiTags("Authentication")
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  private setSession(
    response: Response,
    result: { token: string; expiresAt: Date; user: SafeUser }
  ) {
    response.cookie(
      "postmade_session",
      result.token,
      cookieOptions(process.env.COOKIE_SECURE === "true", result.expiresAt)
    );
    return result.user;
  }
  @Post("auth/register/start")
  @ApiOperation({ summary: "Start native account registration" })
  @ApiCreatedResponse({ type: ChallengeResponseDto })
  registerStart(@Body() body: RegisterStartDto) {
    return this.auth.startRegistration(
      body.name,
      body.email,
      body.password,
      body.timezone
    );
  }
  @Post("auth/register/verify")
  @ApiOperation({ summary: "Verify registration and create the account" })
  @ApiOkResponse({ type: UserResponseDto })
  async registerVerify(
    @Body() body: VerifyChallengeDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.setSession(
      response,
      await this.auth.verifyRegistration(body.challengeId, body.code)
    );
  }
  @Post("auth/login/start")
  @HttpCode(200)
  @ApiOperation({ summary: "Validate password and send a login code" })
  @ApiOkResponse({ type: ChallengeResponseDto })
  loginStart(@Body() body: LoginStartDto) {
    return this.auth.startLogin(body.email, body.password);
  }
  @Post("auth/login/verify")
  @HttpCode(200)
  @ApiOperation({ summary: "Verify login code and create a session" })
  @ApiOkResponse({ type: UserResponseDto })
  async loginVerify(
    @Body() body: VerifyChallengeDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.setSession(
      response,
      await this.auth.verifyLogin(body.challengeId, body.code)
    );
  }
  @Post("auth/code/resend")
  @HttpCode(200)
  @ApiOperation({ summary: "Resend the current challenge code" })
  @ApiOkResponse({ type: ChallengeResponseDto })
  resend(@Body() body: ResendCodeDto) {
    return this.auth.resend(body.challengeId);
  }
  @Post("auth/password/forgot")
  @HttpCode(200)
  @ApiOperation({
    summary: "Start password recovery without account enumeration",
  })
  @ApiOkResponse({ type: ChallengeResponseDto })
  forgot(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body.email);
  }
  @Post("auth/password/reset")
  @HttpCode(204)
  @ApiOperation({ summary: "Reset password with an email challenge" })
  @ApiNoContentResponse()
  async reset(@Body() body: ResetPasswordDto) {
    await this.auth.resetPassword(body.challengeId, body.code, body.password);
  }
  @Post("auth/logout")
  @HttpCode(204)
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Revoke the current session" })
  @ApiNoContentResponse()
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.auth.logout(request.sessionId);
    response.clearCookie("postmade_session", { path: "/" });
  }
  @Get("me")
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Return the authenticated user" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  me(@CurrentUser() user: SafeUser) {
    return user;
  }
}
