import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/services/prisma.service";

export interface RecordDomainEventInput {
  organizationId?: string;
  type: string;
  entityType: string;
  entityId: string;
  payload: Prisma.InputJsonValue;
}

@Injectable()
export class DomainEventsService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: RecordDomainEventInput) {
    return this.prisma.domainEvent.create({
      data: {
        organizationId: input.organizationId ?? null,
        type: input.type,
        entityType: input.entityType,
        entityId: input.entityId,
        payload: input.payload
      }
    });
  }
}
