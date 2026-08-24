import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { SocialPlatform } from "@postmade/types";
import type { Response } from "express";

import { CurrentUser, SessionGuard } from "../auth/auth.guard.js";
import type { SafeUser } from "../auth/auth.service.js";
import { ApiErrorDto } from "../common/api-error.dto.js";
import {
  ChannelsLookupQueryDto,
  ChannelsLookupResponseDto,
  ChannelsPageResponseDto,
  ChannelsQueryDto,
  StartOAuthResponseDto,
} from "./channels.dto.js";
import { ChannelsService } from "./channels.service.js";

@ApiTags("Channels")
@Controller()
export class ChannelsController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly config: ConfigService
  ) {}

  @Get("workspaces/:workspaceId/channels")
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: "List active workspace channels" })
  @ApiOkResponse({ type: ChannelsPageResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  list(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Query() query: ChannelsQueryDto
  ) {
    return this.channels.list(user.id, workspaceId, query);
  }

  @Get("workspaces/:workspaceId/channels/lookup")
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: "Look up workspace channels" })
  @ApiOkResponse({ type: ChannelsLookupResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  lookup(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Query() query: ChannelsLookupQueryDto
  ) {
    return this.channels.lookup(user.id, workspaceId, query);
  }

  @Post("workspaces/:workspaceId/channels/oauth/:platform/start")
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: "Start a simulated channel OAuth flow" })
  @ApiOkResponse({ type: StartOAuthResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  startOAuth(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("platform") platform: SocialPlatform
  ) {
    return this.channels.startOAuth(user.id, workspaceId, platform);
  }

  @Get("channels/oauth/mock/callback")
  @ApiOperation({ summary: "Complete the simulated channel OAuth flow" })
  async callback(@Query("state") state: string, @Res() response: Response) {
    const webUrl = this.config.getOrThrow<string>("WEB_APP_URL");
    try {
      const platform = await this.channels.completeMockOAuth(state);
      response.redirect(
        `${webUrl}/channels?channelConnection=success&platform=${platform}`
      );
    } catch (error) {
      const code =
        typeof error === "object" &&
        error &&
        "getResponse" in error &&
        typeof error.getResponse === "function"
          ? String(
              (error.getResponse() as { code?: string }).code ??
                "INTERNAL_ERROR"
            )
          : "INTERNAL_ERROR";
      response.redirect(
        `${webUrl}/channels?channelConnection=error&code=${encodeURIComponent(code)}`
      );
    }
  }

  @Delete("workspaces/:workspaceId/channels/:channelId")
  @HttpCode(204)
  @ApiCookieAuth()
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: "Disconnect a workspace channel" })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async disconnect(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("channelId") channelId: string
  ) {
    await this.channels.disconnect(user.id, workspaceId, channelId);
  }
}
