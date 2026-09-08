import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser, SessionGuard } from "../auth/auth.guard.js";
import type { SafeUser } from "../auth/auth.service.js";
import {
  CreateMediaUploadDto,
  MediaAccessResponseDto,
  MediaResponseDto,
  MediaUploadResponseDto,
} from "./media.dto.js";
import { MediaService } from "./media.service.js";

@ApiTags("Media")
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller("workspaces/:workspaceId/media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post("uploads")
  @ApiOperation({ summary: "Create a direct media upload" })
  @ApiCreatedResponse({ type: MediaUploadResponseDto })
  create(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Body() body: CreateMediaUploadDto
  ) {
    return this.media.createUpload(user.id, workspaceId, body);
  }

  @Post(":mediaId/complete")
  @ApiOperation({ summary: "Validate and complete a media upload" })
  @ApiOkResponse({ type: MediaResponseDto })
  complete(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("mediaId") id: string
  ) {
    return this.media.complete(user.id, workspaceId, id);
  }

  @Get(":mediaId/access")
  @ApiOperation({ summary: "Create a temporary media access URL" })
  @ApiOkResponse({ type: MediaAccessResponseDto })
  access(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("mediaId") id: string
  ) {
    return this.media.accessUrl(user.id, workspaceId, id);
  }

  @Delete(":mediaId")
  @HttpCode(204)
  @ApiNoContentResponse()
  async delete(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("mediaId") id: string
  ) {
    await this.media.delete(user.id, workspaceId, id);
  }
}
