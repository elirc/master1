import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequireOrganizationRoles } from "../auth/roles.decorators";
import { OrganizationRoleGuard } from "../auth/roles.guard";
import { CreateTimeOffRequestDto } from "./dto/create-time-off-request.dto";
import { ReviewTimeOffRequestDto } from "./dto/review-time-off-request.dto";
import { TimeOffService } from "./time-off.service";

@Controller()
export class TimeOffController {
  constructor(private readonly timeOff: TimeOffService) {}

  @Get("time-off-requests")
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_HR_ADMIN", "CLIENT_MANAGER", "WORKER")
  list(@Query("organizationId") organizationId: string) {
    return this.timeOff.list(organizationId);
  }

  @Get("workers/:workerId/time-off-balances")
  @UseGuards(AuthGuard)
  balances(@Param("workerId") workerId: string, @Query("year") year?: string) {
    return this.timeOff.balances(workerId, year ? Number(year) : new Date().getFullYear());
  }

  @Post("workers/:workerId/time-off-requests")
  @UseGuards(AuthGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Param("workerId") workerId: string,
    @Body() dto: CreateTimeOffRequestDto
  ) {
    return this.timeOff.create(contextFromRequest(request), workerId, dto);
  }

  @Patch("time-off-requests/:id/review")
  @UseGuards(AuthGuard)
  review(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: ReviewTimeOffRequestDto
  ) {
    return this.timeOff.review(contextFromRequest(request), id, dto);
  }
}
