import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequireOrganizationRoles, RequirePlatformRoles } from "../auth/roles.decorators";
import { OrganizationRoleGuard, PlatformRoleGuard } from "../auth/roles.guard";
import { AttachExpensePayrollDto } from "./dto/attach-expense-payroll.dto";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { ReviewExpenseDto } from "./dto/review-expense.dto";
import { ExpensesService } from "./expenses.service";

@Controller()
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get("expenses")
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_HR_ADMIN", "CLIENT_FINANCE", "CLIENT_MANAGER", "WORKER")
  list(@Query("organizationId") organizationId: string) {
    return this.expenses.list(organizationId);
  }

  @Post("workers/:workerId/expenses")
  @UseGuards(AuthGuard)
  create(@Req() request: AuthenticatedRequest, @Param("workerId") workerId: string, @Body() dto: CreateExpenseDto) {
    return this.expenses.create(contextFromRequest(request), workerId, dto);
  }

  @Patch("expenses/:id/review")
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_FINANCE", "CLIENT_MANAGER")
  review(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: ReviewExpenseDto) {
    return this.expenses.review(contextFromRequest(request), id, dto);
  }

  @Patch("expenses/:id/mark-reimbursed")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "PAYROLL_SPECIALIST", "FINANCE_OPS")
  markReimbursed(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.expenses.markReimbursed(contextFromRequest(request), id);
  }

  @Patch("expenses/:id/attach-payroll")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "PAYROLL_SPECIALIST", "FINANCE_OPS")
  attachPayroll(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: AttachExpensePayrollDto
  ) {
    return this.expenses.attachPayroll(contextFromRequest(request), id, dto);
  }
}
