import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser, SessionGuard } from "../auth/auth.guard.js";
import type { SafeUser } from "../auth/auth.service.js";
import { WorkspaceMembersService } from "./workspace-members.service.js";

@ApiTags("Workspace invitations")
@Controller("workspace-invitations")
export class WorkspaceInvitationsController {
  constructor(private readonly members: WorkspaceMembersService) {}

  @Get(":token")
  details(@Param("token") token: string) {
    return this.members.details(token);
  }

  @Post(":token/accept")
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  accept(@CurrentUser() user: SafeUser, @Param("token") token: string) {
    return this.members.accept(user.id, user.email, token);
  }
}
