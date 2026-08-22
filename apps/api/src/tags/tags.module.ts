import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { TagsController } from "./tags.controller.js";
import { TagsService } from "./tags.service.js";

@Module({
  imports: [AuthModule, WorkspacesModule],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
