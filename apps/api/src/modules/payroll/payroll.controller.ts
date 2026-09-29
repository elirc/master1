import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequireOrganizationRoles, RequirePlatformRoles } from "../auth/roles.decorators";
import { OrganizationRoleGuard, PlatformRoleGuard } from "../auth/roles.guard";
import { AdvancePayrollCycleDto } from "./dto/advance-payroll-cycle.dto";
import { CreatePayrollCycleDto } from "./dto/create-payroll-cycle.dto";
import { PayrollService } from "./payroll.service";

@Controller("payroll-cycles")
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Get()
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_FINANCE")
  list(@Query("organizationId") organizationId?: string) {
    return this.payroll.list(organizationId);
  }

  @Post()
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "PAYROLL_SPECIALIST")
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreatePayrollCycleDto) {
    return this.payroll.create(contextFromRequest(request), dto);
  }

  @Patch(":id/advance")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "PAYROLL_SPECIALIST")
  advance(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: AdvancePayrollCycleDto
  ) {
    return this.payroll.advance(contextFromRequest(request), id, dto.status);
  }
}
