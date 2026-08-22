import {
  Body,
  Controller,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ChallengeResponseDto, UserResponseDto } from "../auth/auth.dto.js";
import {
  CurrentUser,
  SessionGuard,
  type AuthenticatedRequest,
} from "../auth/auth.guard.js";
import type { SafeUser } from "../auth/auth.service.js";
import { ApiErrorDto } from "../common/api-error.dto.js";
import {
  ChangePasswordDto,
  ResendEmailChangeDto,
  StartEmailChangeDto,
  UpdateProfileDto,
  VerifyEmailChangeDto,
} from "./account.dto.js";
import { AccountService } from "./account.service.js";

@ApiTags("Account")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ type: ApiErrorDto })
@UseGuards(SessionGuard)
@Controller("account")
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Patch("profile")
  @ApiOperation({ summary: "Update the authenticated user's profile" })
  @ApiOkResponse({ type: UserResponseDto })
  updateProfile(@CurrentUser() user: SafeUser, @Body() body: UpdateProfileDto) {
    return this.account.updateProfile(user.id, body.name);
  }
  @Post("email/change/start")
  @HttpCode(200)
  @ApiOperation({ summary: "Send a verification code to a new email address" })
  @ApiOkResponse({ type: ChallengeResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorDto })
  startEmail(@CurrentUser() user: SafeUser, @Body() body: StartEmailChangeDto) {
    return this.account.startEmailChange(user.id, body.newEmail);
  }
  @Post("email/change/verify")
  @HttpCode(200)
  @ApiOperation({ summary: "Verify and apply a new email address" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorDto })
  verifyEmail(
    @CurrentUser() user: SafeUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: VerifyEmailChangeDto
  ) {
    return this.account.verifyEmailChange(
      user.id,
      request.sessionId,
      body.challengeId,
      body.code
    );
  }
  @Post("email/change/resend")
  @HttpCode(200)
  @ApiOperation({ summary: "Resend the email-change verification code" })
  @ApiOkResponse({ type: ChallengeResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorDto })
  resendEmail(
    @CurrentUser() user: SafeUser,
    @Body() body: ResendEmailChangeDto
  ) {
    return this.account.resendEmailChange(user.id, body.challengeId);
  }
  @Patch("password")
  @HttpCode(204)
  @ApiOperation({ summary: "Change the authenticated user's password" })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorDto })
  async changePassword(
    @CurrentUser() user: SafeUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: ChangePasswordDto
  ) {
    await this.account.changePassword(
      user.id,
      request.sessionId,
      body.currentPassword,
      body.newPassword
    );
  }
}
