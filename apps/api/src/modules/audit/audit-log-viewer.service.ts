import { ForbiddenException, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { pagedResponse, parsePagination, type PaginationQuery } from "../../common/pagination";
import type { AuthenticatedPrincipal } from "../auth/auth.types";
import { canAccessOrganization, organizationScopeForPrincipal } from "../auth/tenant-scope";
import { PrismaService } from "../prisma/services/prisma.service";

export interface AuditLogFilters extends PaginationQuery {
  organizationId?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
}

@Injectable()
export class AuditLogViewerService {
  constructor(private readonly prisma: PrismaService) {}

  list(principal: AuthenticatedPrincipal | undefined, filters: AuditLogFilters) {
    if (!principal) {
      throw new ForbiddenException("Authentication context is required.");
    }

    const where: Prisma.AuditLogWhereInput = {
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.action ? { action: filters.action } : {})
    };

    if (filters.organizationId) {
      if (!canAccessOrganization(principal, filters.organizationId)) {
        throw new ForbiddenException("You do not have access to this organization's audit logs.");
      }
      where.organizationId = filters.organizationId;
    } else {
      const scope = organizationScopeForPrincipal(principal);
      if (scope !== "ALL") {
        where.organizationId = { in: scope };
      }
    }

    const pagination = parsePagination(filters);
    return this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: { actor: true, organization: true }
      }),
      this.prisma.auditLog.count({ where })
    ]).then(([logs, total]) => pagedResponse(logs, total, pagination));
  }
}
