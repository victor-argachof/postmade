import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser, SessionGuard } from "../auth/auth.guard.js";
import type { SafeUser } from "../auth/auth.service.js";
import {
  CreateInvitationDto,
  UpdateMemberRoleDto,
} from "./workspace-members.dto.js";
import { WorkspaceMembersService } from "./workspace-members.service.js";
import { UpdateWorkspaceDto, WorkspaceResponseDto } from "./workspaces.dto.js";
import { WorkspacesService } from "./workspaces.service.js";

@ApiTags("Workspaces")
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller("workspaces")
export class WorkspacesController {
  constructor(
    private readonly workspaces: WorkspacesService,
    private readonly members: WorkspaceMembersService
  ) {}
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
  @Get(":workspaceId/members")
  listMembers(@CurrentUser() user: SafeUser, @Param("workspaceId") id: string) {
    return this.members.listMembers(user.id, id);
  }
  @Get(":workspaceId/invitations")
  listInvitations(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") id: string
  ) {
    return this.members.listInvitations(user.id, id);
  }
  @Post(":workspaceId/invitations")
  createInvitation(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") id: string,
    @Body() body: CreateInvitationDto
  ) {
    return this.members.create(user.id, id, body.email, body.role);
  }
  @Post(":workspaceId/invitations/:invitationId/resend")
  resendInvitation(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") id: string,
    @Param("invitationId") invitationId: string
  ) {
    return this.members.resend(user.id, id, invitationId);
  }
  @Delete(":workspaceId/invitations/:invitationId")
  @HttpCode(204)
  async revokeInvitation(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") id: string,
    @Param("invitationId") invitationId: string
  ) {
    await this.members.revoke(user.id, id, invitationId);
  }
  @Patch(":workspaceId/members/:memberId")
  updateMember(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") id: string,
    @Param("memberId") memberId: string,
    @Body() body: UpdateMemberRoleDto
  ) {
    return this.members.updateRole(user.id, id, memberId, body.role);
  }
  @Delete(":workspaceId/members/:memberId")
  @HttpCode(204)
  async removeMember(
    @CurrentUser() user: SafeUser,
    @Param("workspaceId") id: string,
    @Param("memberId") memberId: string
  ) {
    await this.members.remove(user.id, id, memberId);
  }
}
