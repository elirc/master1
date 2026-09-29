import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequireOrganizationRoles, RequirePlatformRoles } from "../auth/roles.decorators";
import { OrganizationRoleGuard, PlatformRoleGuard } from "../auth/roles.guard";
import { CompleteWorkerProfileDto } from "./dto/complete-worker-profile.dto";
import { CreateProfileEditRequestDto } from "./dto/create-profile-edit-request.dto";
import { ImportWorkersCsvDto } from "./dto/import-workers-csv.dto";
import { ReviewProfileEditRequestDto } from "./dto/review-profile-edit-request.dto";
import { WorkersService } from "./workers.service";

@Controller("workers")
export class WorkersController {
  constructor(private readonly workers: WorkersService) {}

  @Get("self/portal")
  @UseGuards(AuthGuard)
  portal(@Req() request: AuthenticatedRequest) {
    return this.workers.portal(request.auth?.userId);
  }

  @Get()
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_HR_ADMIN", "CLIENT_FINANCE", "CLIENT_MANAGER", "WORKER")
  list(@Query("organizationId") organizationId?: string, @Query("search") search?: string) {
    return this.workers.list(organizationId, search);
  }

  @Patch("profile-edit-requests/:id/review")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "ONBOARDING_SPECIALIST", "COMPLIANCE_REVIEWER", "SUPPORT_AGENT")
  reviewProfileEditRequest(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: ReviewProfileEditRequestDto
  ) {
    return this.workers.reviewProfileEditRequest(contextFromRequest(request), id, dto);
  }

  @Get(":id/profile-edit-requests")
  @UseGuards(AuthGuard)
  listProfileEditRequests(@Param("id") id: string) {
    return this.workers.listProfileEditRequests(id);
  }

  @Patch(":id/profile-edit-requests")
  @UseGuards(AuthGuard)
  createProfileEditRequest(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: CreateProfileEditRequestDto
  ) {
    return this.workers.createProfileEditRequest(contextFromRequest(request), id, dto);
  }

  @Patch("imports/csv")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "ONBOARDING_SPECIALIST")
  importCsv(@Req() request: AuthenticatedRequest, @Body() dto: ImportWorkersCsvDto) {
    return this.workers.importCsv(contextFromRequest(request), dto);
  }

  @Patch(":id/profile")
  @UseGuards(AuthGuard)
  completeProfile(@Param("id") id: string, @Body() dto: CompleteWorkerProfileDto) {
    return this.workers.completeProfile(id, dto);
  }

  @Patch(":id/activate")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "ONBOARDING_SPECIALIST", "COMPLIANCE_REVIEWER")
  activate(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.workers.activate(contextFromRequest(request), id);
  }
}
