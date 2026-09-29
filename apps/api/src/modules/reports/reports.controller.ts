import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { RequireOrganizationRoles } from "../auth/roles.decorators";
import { OrganizationRoleGuard } from "../auth/roles.guard";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(AuthGuard, OrganizationRoleGuard)
@RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_HR_ADMIN", "CLIENT_FINANCE")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("workers.csv")
  async workers(@Query("organizationId") organizationId: string, @Res() response: Response) {
    return sendCsv(response, "workers.csv", await this.reports.workersCsv(organizationId));
  }

  @Get("invoices.csv")
  async invoices(@Query("organizationId") organizationId: string, @Res() response: Response) {
    return sendCsv(response, "invoices.csv", await this.reports.invoicesCsv(organizationId));
  }

  @Get("audit.csv")
  async audit(@Query("organizationId") organizationId: string, @Res() response: Response) {
    return sendCsv(response, "audit.csv", await this.reports.auditCsv(organizationId));
  }
}

function sendCsv(response: Response, fileName: string, csv: string) {
  response.setHeader("content-type", "text/csv; charset=utf-8");
  response.setHeader("content-disposition", `attachment; filename="${fileName}"`);
  return response.send(csv);
}
