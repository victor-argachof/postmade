import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;
  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      maxRetriesPerRequest: 2,
    });
  }
  async onModuleDestroy() {
    await this.client.quit();
  }
  async assertLimit(
    scope: string,
    identifier: string,
    limit = 5,
    seconds = 60
  ) {
    const key = `rate:${scope}:${identifier}`;
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, seconds);
    return count <= limit;
  }
}
