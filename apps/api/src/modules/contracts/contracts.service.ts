import { BadRequestException, Injectable } from "@nestjs/common";
import type { RequestContext } from "../../common/request-context";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list(organizationId: string) {
    return this.prisma.employmentContract.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { worker: true, employmentRecord: true }
    });
  }

  async generate(context: RequestContext, workerId: string) {
    const worker = await this.prisma.worker.findUniqueOrThrow({
      where: { id: workerId },
      include: { organization: true, employment: true }
    });
    if (!worker.employment) {
      throw new BadRequestException("Worker needs an employment record before contract generation.");
    }

    const contractNumber = `CTR-${new Date().getFullYear()}-${worker.id.slice(-6).toUpperCase()}`;
    const html = renderContract(worker);
    const contract = await this.prisma.employmentContract.upsert({
      where: { contractNumber },
      update: {
        html,
        status: "GENERATED",
        generatedAt: new Date()
      },
      create: {
        organizationId: worker.organizationId,
        workerId,
        employmentRecordId: worker.employment.id,
        contractNumber,
        storageKey: `contracts/${worker.organizationId}/${contractNumber}.html`,
        html
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: worker.organizationId },
      action: "employment_contract.generated",
      entityType: "EmploymentContract",
      entityId: contract.id,
      after: { contractNumber: contract.contractNumber, storageKey: contract.storageKey }
    });

    return contract;
  }
}

function renderContract(worker: {
  legalName: string;
  countryCode: string;
  organization: { legalName: string };
  employment: {
    jobTitle: string;
    salaryAmountMinor: number;
    salaryCurrency: string;
    startDate: Date;
  } | null;
}) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Employment Agreement</title></head>
<body>
  <h1>Employment Agreement</h1>
  <p>This agreement is between ${escapeHtml(worker.organization.legalName)} and ${escapeHtml(worker.legalName)}.</p>
  <p>Role: ${escapeHtml(worker.employment?.jobTitle ?? "Employee")}</p>
  <p>Country: ${escapeHtml(worker.countryCode)}</p>
  <p>Start date: ${worker.employment?.startDate.toISOString().slice(0, 10)}</p>
  <p>Salary: ${worker.employment?.salaryCurrency} ${((worker.employment?.salaryAmountMinor ?? 0) / 100).toFixed(2)}</p>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
