import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequirePlatformRoles } from "../auth/roles.decorators";
import { PlatformRoleGuard } from "../auth/roles.guard";
import { CreatePayrollAdjustmentDto } from "./dto/create-payroll-adjustment.dto";
import { ReviewPayrollAdjustmentDto } from "./dto/review-payroll-adjustment.dto";
import { PayrollAdjustmentsService } from "./payroll-adjustments.service";

@Controller()
@UseGuards(AuthGuard, PlatformRoleGuard)
@RequirePlatformRoles("PLATFORM_ADMIN", "PAYROLL_SPECIALIST")
export class PayrollAdjustmentsController {
  constructor(private readonly adjustments: PayrollAdjustmentsService) {}

  @Get("payroll-adjustments")
  list(
    @Query("organizationId") organizationId: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    const query: { organizationId: string; page?: string; pageSize?: string } = { organizationId };
    if (page) query.page = page;
    if (pageSize) query.pageSize = pageSize;
    return this.adjustments.list(query);
  }

  @Post("workers/:workerId/payroll-adjustments")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("workerId") workerId: string,
    @Body() dto: CreatePayrollAdjustmentDto
  ) {
    return this.adjustments.create(contextFromRequest(request), workerId, dto);
  }

  @Patch("payroll-adjustments/:id/review")
  review(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: ReviewPayrollAdjustmentDto) {
    return this.adjustments.review(contextFromRequest(request), id, dto);
  }
}
