import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AccountModule } from "./account/account.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { ChannelsModule } from "./channels/channels.module.js";
import { validateConfig } from "./config.js";
import { HealthModule } from "./health/health.module.js";
import { InfrastructureModule } from "./infrastructure/infrastructure.module.js";
import { PublicationsModule } from "./publications/publications.module.js";
import { TagsModule } from "./tags/tags.module.js";
import { WorkspacesModule } from "./workspaces/workspaces.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    InfrastructureModule,
    AuthModule,
    AccountModule,
    ChannelsModule,
    PublicationsModule,
    WorkspacesModule,
    TagsModule,
    HealthModule,
  ],
})
export class AppModule {}
