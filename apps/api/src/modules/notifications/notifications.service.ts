import { ForbiddenException, Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { loadConfig } from "@globalwork/config";
import { DomainEventsService } from "../events/domain-events.service";
import { outboxJobOptions } from "../outbox/queue-policy";
import { PrismaService } from "../prisma/services/prisma.service";
import { UpsertNotificationPreferenceDto } from "./dto/upsert-notification-preference.dto";

@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private readonly config = loadConfig();
  private readonly connection = new IORedis(this.config.REDIS_URL, {
    maxRetriesPerRequest: null
  });
  private readonly outboxQueue = new Queue("outbox", {
    connection: this.connection
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly domainEvents: DomainEventsService
  ) {}

  list(organizationId?: string) {
    return this.prisma.notification.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { createdAt: "desc" }
    });
  }

  listPreferences(userId?: string) {
    if (!userId) {
      throw new ForbiddenException("Notification preferences require an authenticated user.");
    }

    return this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { type: "asc" }
    });
  }

  upsertPreference(userId: string | undefined, dto: UpsertNotificationPreferenceDto) {
    if (!userId) {
      throw new ForbiddenException("Notification preferences require an authenticated user.");
    }

    return this.prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId,
          type: dto.type
        }
      },
      update: { emailEnabled: dto.emailEnabled },
      create: {
        userId,
        type: dto.type,
        emailEnabled: dto.emailEnabled
      }
    });
  }

  async createAndQueue(input: {
    organizationId?: string;
    userId?: string;
    type: string;
    subject: string;
    body: string;
  }) {
    if (input.userId) {
      const preference = await this.prisma.notificationPreference.findUnique({
        where: {
          userId_type: {
            userId: input.userId,
            type: input.type
          }
        }
      });

      if (preference && !preference.emailEnabled) {
        return this.prisma.notification.create({
          data: {
            organizationId: input.organizationId ?? null,
            userId: input.userId,
            type: input.type,
            subject: input.subject,
            body: input.body,
            status: "FAILED"
          }
        });
      }
    }

    const { notification, outboxEvent } = await this.prisma.$transaction(async (tx) => {
      const notification = await tx.notification.create({
        data: {
          organizationId: input.organizationId ?? null,
          userId: input.userId ?? null,
          type: input.type,
          subject: input.subject,
          body: input.body
        }
      });

      const outboxEvent = await tx.outboxEvent.create({
        data: {
          type: "notification.email",
          payload: {
            notificationId: notification.id
          }
        }
      });

      return { notification, outboxEvent };
    });

    await this.domainEvents.record({
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      type: "notification.created",
      entityType: "Notification",
      entityId: notification.id,
      payload: {
        type: notification.type,
        userId: notification.userId,
        subject: notification.subject
      }
    });

    await this.outboxQueue.add(
      "process-outbox-event",
      { outboxEventId: outboxEvent.id },
      outboxJobOptions
    );

    return notification;
  }

  async onModuleDestroy() {
    await this.outboxQueue.close();
    await this.connection.quit();
  }
}
