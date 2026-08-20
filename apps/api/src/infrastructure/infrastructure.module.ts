import { Global, Module } from "@nestjs/common";

import { MailService } from "./mail.service.js";
import { PrismaService } from "./prisma.service.js";
import { RedisService } from "./redis.service.js";

@Global()
@Module({
  providers: [PrismaService, RedisService, MailService],
  exports: [PrismaService, RedisService, MailService],
})
export class InfrastructureModule {}
