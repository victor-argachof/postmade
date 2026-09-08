import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, Worker } from "bullmq";

import { ObjectStorageService } from "../infrastructure/object-storage.service.js";
import { PrismaService } from "../infrastructure/prisma.service.js";

const QUEUE = "media-maintenance";

@Injectable()
export class MediaCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaCleanupService.name);
  private readonly queue: Queue;
  private readonly worker: Worker;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorageService
  ) {
    const connection = { url: config.getOrThrow<string>("REDIS_URL") };
    this.queue = new Queue(QUEUE, { connection });
    this.worker = new Worker(QUEUE, () => this.cleanup(), {
      connection,
      concurrency: 1,
    });
  }

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      "expired-media-hourly",
      { every: 60 * 60 * 1000 },
      {
        name: "delete-expired-media",
        opts: { attempts: 5, backoff: { type: "exponential", delay: 5_000 } },
      }
    );
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.queue.close();
  }

  async cleanup() {
    const candidates = await this.prisma.mediaAsset.findMany({
      where: {
        expiresAt: { lte: new Date() },
        status: { in: ["pending", "ready", "failed"] },
      },
      take: 100,
      orderBy: { expiresAt: "asc" },
    });
    let deleted = 0;
    let failed = 0;
    for (const candidate of candidates) {
      try {
        const claimed = await this.prisma.mediaAsset.updateMany({
          where: {
            id: candidate.id,
            status: candidate.status,
            expiresAt: { lte: new Date() },
          },
          data: { status: "deleting" },
        });
        if (!claimed.count) continue;
        await this.storage.delete(candidate.objectKey);
        await this.prisma.mediaAsset.update({
          where: { id: candidate.id },
          data: { status: "deleted", deletedAt: new Date() },
        });
        deleted++;
      } catch {
        failed++;
        await this.prisma.mediaAsset.updateMany({
          where: { id: candidate.id, status: "deleting" },
          data: {
            status: "failed",
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        });
      }
    }
    this.logger.log(
      `Media cleanup examined=${candidates.length} deleted=${deleted} failed=${failed}`
    );
    if (failed) throw new Error(`Media cleanup failed for ${failed} object(s)`);
  }
}
