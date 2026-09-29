import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequireOrganizationRoles } from "../auth/roles.decorators";
import { OrganizationRoleGuard } from "../auth/roles.guard";
import { UpsertNotificationPreferenceDto } from "./dto/upsert-notification-preference.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_HR_ADMIN", "CLIENT_FINANCE", "CLIENT_MANAGER", "WORKER")
  list(@Query("organizationId") organizationId?: string) {
    return this.notifications.list(organizationId);
  }

  @Get("preferences")
  @UseGuards(AuthGuard)
  preferences(@Req() request: AuthenticatedRequest) {
    return this.notifications.listPreferences(request.auth?.userId);
  }

  @Post("preferences")
  @UseGuards(AuthGuard)
  upsertPreference(@Req() request: AuthenticatedRequest, @Body() dto: UpsertNotificationPreferenceDto) {
    return this.notifications.upsertPreference(request.auth?.userId, dto);
  }
}
