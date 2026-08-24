import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { MockChannelProvider } from "./channel-provider.js";
import { ChannelsController } from "./channels.controller.js";
import { ChannelsService } from "./channels.service.js";

@Module({
  imports: [AuthModule, WorkspacesModule],
  controllers: [ChannelsController],
  providers: [ChannelsService, MockChannelProvider],
})
export class ChannelsModule {}
