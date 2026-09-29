import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequireOrganizationRoles, RequirePlatformRoles } from "../auth/roles.decorators";
import { OrganizationRoleGuard, PlatformRoleGuard } from "../auth/roles.guard";
import { RecordInvoicePaymentDto } from "./dto/record-invoice-payment.dto";
import { InvoicesService } from "./invoices.service";

@Controller()
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get("invoices")
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_FINANCE")
  list(@Query("organizationId") organizationId?: string) {
    return this.invoices.list(organizationId);
  }

  @Post("payroll-cycles/:payrollCycleId/invoice")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "FINANCE_OPS")
  createFromPayroll(
    @Req() request: AuthenticatedRequest,
    @Param("payrollCycleId") payrollCycleId: string
  ) {
    return this.invoices.createFromPayroll(contextFromRequest(request), payrollCycleId);
  }

  @Patch("invoices/:id/issue")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "FINANCE_OPS")
  issue(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.invoices.issue(contextFromRequest(request), id);
  }

  @Patch("invoices/:id/mark-paid")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "FINANCE_OPS")
  markPaid(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.invoices.markPaid(contextFromRequest(request), id);
  }

  @Post("invoices/:id/payments")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "FINANCE_OPS")
  recordPayment(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: RecordInvoicePaymentDto
  ) {
    return this.invoices.recordPayment(contextFromRequest(request), id, dto);
  }

  @Patch("invoices/:id/generate-pdf")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "FINANCE_OPS")
  generatePdf(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.invoices.generatePdf(contextFromRequest(request), id);
  }
}
