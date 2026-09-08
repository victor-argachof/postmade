import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { MediaCleanupService } from "./media-cleanup.service.js";
import { MediaController } from "./media.controller.js";
import { MediaService } from "./media.service.js";

@Module({
  imports: [AuthModule, WorkspacesModule],
  controllers: [MediaController],
  providers: [MediaService, MediaCleanupService],
  exports: [MediaService],
})
export class MediaModule {}
