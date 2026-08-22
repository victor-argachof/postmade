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
  TagGroupBodyDto,
  TagGroupResponseDto,
  TagGroupsLookupQueryDto,
  TagGroupsLookupResponseDto,
  TagGroupsPageResponseDto,
  TagGroupsQueryDto,
} from "./tags.dto.js";
import { TagsService } from "./tags.service.js";

@ApiTags("Tags")
@ApiCookieAuth()
@ApiUnauthorizedResponse({ type: ApiErrorDto })
@UseGuards(SessionGuard)
@Controller("workspaces/:workspaceId/tag-groups")
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  @ApiOperation({ summary: "List workspace tag groups with pagination" })
  @ApiOkResponse({ type: TagGroupsPageResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  list(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Query() query: TagGroupsQueryDto
  ) {
    return this.tags.list(user.id, workspaceId, query);
  }

  @Get("lookup")
  @ApiOperation({ summary: "Look up tag groups for publication composition" })
  @ApiOkResponse({ type: TagGroupsLookupResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  lookup(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Query() query: TagGroupsLookupQueryDto
  ) {
    return this.tags.lookup(user.id, workspaceId, query);
  }

  @Post()
  @ApiOperation({ summary: "Create a workspace tag group" })
  @ApiCreatedResponse({ type: TagGroupResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiConflictResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  create(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Body() body: TagGroupBodyDto
  ) {
    return this.tags.create(user.id, workspaceId, body);
  }

  @Patch(":tagGroupId")
  @ApiOperation({ summary: "Update a workspace tag group" })
  @ApiOkResponse({ type: TagGroupResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiConflictResponse({ type: ApiErrorDto })
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  update(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("tagGroupId") id: string,
    @Body() body: TagGroupBodyDto
  ) {
    return this.tags.update(user.id, workspaceId, id, body);
  }

  @Delete(":tagGroupId")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a workspace tag group" })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async delete(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") workspaceId: string,
    @Param("tagGroupId") id: string
  ) {
    await this.tags.delete(user.id, workspaceId, id);
  }
}
