import { Global, Module } from "@nestjs/common";

import { MailService } from "./mail.service.js";
import { ObjectStorageService } from "./object-storage.service.js";
import { PrismaService } from "./prisma.service.js";
import { RedisService } from "./redis.service.js";

@Global()
@Module({
  providers: [PrismaService, RedisService, MailService, ObjectStorageService],
  exports: [PrismaService, RedisService, MailService, ObjectStorageService],
})
export class InfrastructureModule {}
