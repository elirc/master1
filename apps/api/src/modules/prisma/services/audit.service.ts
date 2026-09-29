import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { RequestContext } from "../../../common/request-context";
import { PrismaService } from "./prisma.service";

interface AuditInput {
  context: RequestContext;
  action: string;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: input.context.organizationId ?? null,
        actorId: input.context.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before ?? Prisma.JsonNull,
        after: input.after ?? Prisma.JsonNull,
        metadata: input.metadata ?? Prisma.JsonNull
      }
    });
  }
}
