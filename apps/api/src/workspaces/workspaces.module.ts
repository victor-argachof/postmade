import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { WorkspaceAccessService } from "./workspace-access.service.js";
import { WorkspaceInvitationsController } from "./workspace-invitations.controller.js";
import { WorkspaceMembersService } from "./workspace-members.service.js";
import { WorkspacesController } from "./workspaces.controller.js";
import { WorkspacesService } from "./workspaces.service.js";

@Module({
  imports: [AuthModule],
  controllers: [WorkspacesController, WorkspaceInvitationsController],
  providers: [
    WorkspacesService,
    WorkspaceAccessService,
    WorkspaceMembersService,
  ],
  exports: [WorkspaceAccessService, WorkspaceMembersService],
})
export class WorkspacesModule {}
