import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { AuditLogViewerService, type AuditLogFilters } from "./audit-log-viewer.service";

@Controller("audit-logs")
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private readonly auditLogs: AuditLogViewerService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query("organizationId") organizationId?: string,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("actorId") actorId?: string,
    @Query("action") action?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    const filters: AuditLogFilters = {};
    if (organizationId) filters.organizationId = organizationId;
    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    if (actorId) filters.actorId = actorId;
    if (action) filters.action = action;
    if (page) filters.page = page;
    if (pageSize) filters.pageSize = pageSize;
    return this.auditLogs.list(request.auth, filters);
  }
}
