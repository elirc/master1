import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequireOrganizationRoles, RequirePlatformRoles } from "../auth/roles.decorators";
import { OrganizationRoleGuard, PlatformRoleGuard } from "../auth/roles.guard";
import { CreateHireRequestDto } from "./dto/create-hire-request.dto";
import { HiringService } from "./hiring.service";

@Controller("hire-requests")
export class HiringController {
  constructor(private readonly hiring: HiringService) {}

  @Get()
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_HR_ADMIN", "CLIENT_FINANCE", "CLIENT_MANAGER", "WORKER")
  list(@Query("organizationId") organizationId?: string) {
    return this.hiring.list(organizationId);
  }

  @Post()
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_HR_ADMIN")
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateHireRequestDto) {
    return this.hiring.create(contextFromRequest(request), dto);
  }

  @Patch(":id/submit")
  @UseGuards(AuthGuard)
  submit(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.hiring.submit(contextFromRequest(request), id);
  }

  @Patch(":id/approve")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "ONBOARDING_SPECIALIST", "COMPLIANCE_REVIEWER")
  approve(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.hiring.approveForWorker(contextFromRequest(request), id);
  }
}
