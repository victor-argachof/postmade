import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser, SessionGuard } from "../auth/auth.guard.js";
import type { SafeUser } from "../auth/auth.service.js";
import { UpdateWorkspaceDto, WorkspaceResponseDto } from "./workspaces.dto.js";
import { WorkspacesService } from "./workspaces.service.js";

@ApiTags("Workspaces")
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}
  @Get()
  @ApiOperation({ summary: "List workspaces available to the user" })
  @ApiOkResponse({ type: [WorkspaceResponseDto] })
  list(@CurrentUser() user: SafeUser) {
    return this.workspaces.list(user.id);
  }
  @Get(":workspaceId")
  @ApiOperation({ summary: "Get an available workspace" })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  get(@CurrentUser() user: SafeUser, @Param("workspaceId") id: string) {
    return this.workspaces.get(user.id, id);
  }
  @Patch(":workspaceId")
  @ApiOperation({ summary: "Update workspace name or timezone" })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  update(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") id: string,
    @Body() body: UpdateWorkspaceDto
  ) {
    return this.workspaces.update(user.id, id, body);
  }
}
