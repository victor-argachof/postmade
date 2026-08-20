import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { PrismaService } from "../infrastructure/prisma.service.js";
import { RedisService } from "../infrastructure/redis.service.js";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}
  @Get("live")
  @ApiOperation({ summary: "Process liveness" })
  @ApiOkResponse()
  live() {
    return { status: "ok" };
  }
  @Get("ready")
  @ApiOperation({ summary: "Database and Redis readiness" })
  @ApiOkResponse()
  async ready() {
    try {
      await Promise.all([
        this.prisma.$queryRaw`SELECT 1`,
        this.redis.client.ping(),
      ]);
      return { status: "ok", services: { database: "up", redis: "up" } };
    } catch {
      throw new ServiceUnavailableException({
        code: "NOT_READY",
        message: "A required service is unavailable",
      });
    }
  }
}
