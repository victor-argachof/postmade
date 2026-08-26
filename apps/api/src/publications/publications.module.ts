import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { PublicationsController } from "./publications.controller.js";
import { PublicationsService } from "./publications.service.js";

@Module({
  imports: [AuthModule, WorkspacesModule],
  controllers: [PublicationsController],
  providers: [PublicationsService],
})
export class PublicationsModule {}
