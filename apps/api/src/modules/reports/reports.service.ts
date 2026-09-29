import { Injectable } from "@nestjs/common";
import { toCsv } from "../../common/csv";
import { PrismaService } from "../prisma/services/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async workersCsv(organizationId: string) {
    const workers = await this.prisma.worker.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 500
    });
    return toCsv(
      workers.map((worker) => ({
        id: worker.id,
        legalName: worker.legalName,
        email: worker.email,
        countryCode: worker.countryCode,
        status: worker.status
      }))
    );
  }

  async invoicesCsv(organizationId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 500
    });
    return toCsv(
      invoices.map((invoice) => ({
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        currency: invoice.currency,
        totalMinor: invoice.totalMinor,
        issuedAt: invoice.issuedAt?.toISOString() ?? "",
        paidAt: invoice.paidAt?.toISOString() ?? ""
      }))
    );
  }

  async auditCsv(organizationId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 500
    });
    return toCsv(
      logs.map((log) => ({
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        actorId: log.actorId ?? "",
        createdAt: log.createdAt.toISOString()
      }))
    );
  }
}
