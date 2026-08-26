import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { CurrentUser, SessionGuard } from "../auth/auth.guard.js";
import type { SafeUser } from "../auth/auth.service.js";
import { ApiErrorDto } from "../common/api-error.dto.js";
import {
  PublicationBodyDto,
  PublicationResponseDto,
  PublicationsPageResponseDto,
  PublicationsQueryDto,
} from "./publications.dto.js";
import { PublicationsService } from "./publications.service.js";

@ApiTags("Publications")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ type: ApiErrorDto })
@UseGuards(SessionGuard)
@Controller("workspaces/:workspaceId/publications")
export class PublicationsController {
  constructor(private readonly publications: PublicationsService) {}
  @Get()
  @ApiOperation({ summary: "List workspace publications" })
  @ApiOkResponse({ type: PublicationsPageResponseDto })
  list(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Query() query: PublicationsQueryDto
  ) {
    return this.publications.list(user.id, workspaceId, query);
  }
  @Get(":publicationId")
  @ApiOperation({ summary: "Get a workspace publication" })
  @ApiOkResponse({ type: PublicationResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  get(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("publicationId") id: string
  ) {
    return this.publications.get(user.id, workspaceId, id);
  }
  @Post()
  @ApiOperation({ summary: "Create a workspace publication" })
  @ApiCreatedResponse({ type: PublicationResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiConflictResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  create(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Body() body: PublicationBodyDto
  ) {
    return this.publications.create(user.id, workspaceId, body);
  }
  @Patch(":publicationId")
  @ApiOperation({ summary: "Update a workspace publication" })
  @ApiOkResponse({ type: PublicationResponseDto })
  update(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("publicationId") id: string,
    @Body() body: PublicationBodyDto
  ) {
    return this.publications.update(user.id, workspaceId, id, body);
  }
  @Delete(":publicationId")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a workspace publication" })
  @ApiNoContentResponse()
  async delete(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("publicationId") id: string
  ) {
    await this.publications.delete(user.id, workspaceId, id);
  }
  @Post(":publicationId/duplicate")
  @ApiOperation({ summary: "Duplicate a publication as a draft" })
  @ApiCreatedResponse({ type: PublicationResponseDto })
  duplicate(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("publicationId") id: string
  ) {
    return this.publications.duplicate(user.id, workspaceId, id);
  }
  @Post(":publicationId/cancel")
  @ApiOperation({ summary: "Cancel a scheduled publication" })
  @ApiOkResponse({ type: PublicationResponseDto })
  cancel(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("publicationId") id: string
  ) {
    return this.publications.cancel(user.id, workspaceId, id);
  }
  @Post(":publicationId/retry")
  @ApiOperation({ summary: "Retry a failed simulated publication" })
  @ApiOkResponse({ type: PublicationResponseDto })
  retry(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("publicationId") id: string
  ) {
    return this.publications.retry(user.id, workspaceId, id);
  }
}
