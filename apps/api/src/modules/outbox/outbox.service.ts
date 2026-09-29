import { BadRequestException, Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { loadConfig } from "@globalwork/config";
import type { OutboxEventStatus } from "@prisma/client";
import { PrismaService } from "../prisma/services/prisma.service";
import { outboxJobOptions } from "./queue-policy";

@Injectable()
export class OutboxService implements OnModuleDestroy {
  private readonly config = loadConfig();
  private readonly connection = new IORedis(this.config.REDIS_URL, {
    maxRetriesPerRequest: null
  });
  private readonly queue = new Queue("outbox", { connection: this.connection });

  constructor(private readonly prisma: PrismaService) {}

  list(status?: OutboxEventStatus) {
    return this.prisma.outboxEvent.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async retry(id: string) {
    const event = await this.prisma.outboxEvent.findUniqueOrThrow({ where: { id } });
    if (!["FAILED", "PENDING"].includes(event.status)) {
      throw new BadRequestException(`Outbox event cannot be retried from ${event.status}.`);
    }

    const updated = await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: "PENDING",
        lastError: null
      }
    });

    await this.queue.add("process-outbox-event", { outboxEventId: id }, outboxJobOptions);
    return updated;
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}
