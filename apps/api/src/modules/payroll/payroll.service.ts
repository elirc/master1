import { BadRequestException, Injectable } from "@nestjs/common";
import { assertTransition, isPayrollCycleEditable, payrollCycleTransitions } from "@globalwork/domain";
import type { RequestContext } from "../../common/request-context";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { CreatePayrollCycleDto } from "./dto/create-payroll-cycle.dto";

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list(organizationId?: string) {
    return this.prisma.payrollCycle.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { periodStart: "desc" },
      include: {
        items: { include: { worker: true } },
        invoice: true
      }
    });
  }

  async create(context: RequestContext, dto: CreatePayrollCycleDto) {
    const employments = await this.prisma.employmentRecord.findMany({
      where: {
        organizationId: dto.organizationId,
        countryCode: dto.countryCode,
        status: "ACTIVE"
      },
      include: { worker: true }
    });

    if (employments.length === 0) {
      throw new BadRequestException("No active employments were found for this payroll cycle.");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const cycle = await tx.payrollCycle.create({
        data: {
          organizationId: dto.organizationId,
          countryCode: dto.countryCode,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          status: "OPEN"
        }
      });

      for (const employment of employments) {
        await tx.payrollItem.create({
          data: {
            payrollCycleId: cycle.id,
            workerId: employment.workerId,
            employmentRecordId: employment.id,
            type: "BASE_PAY",
            description: `${employment.worker.legalName} base pay`,
            amountMinor: employment.salaryAmountMinor,
            currency: employment.salaryCurrency
          }
        });

        await tx.payrollItem.create({
          data: {
            payrollCycleId: cycle.id,
            workerId: employment.workerId,
            employmentRecordId: employment.id,
            type: "EMPLOYER_COST",
            description: `${employment.worker.legalName} estimated employer cost`,
            amountMinor: Math.round((employment.salaryAmountMinor * employment.employerCostRateBps) / 10000),
            currency: employment.salaryCurrency
          }
        });

        const unpaidLeaves = await tx.timeOffRequest.findMany({
          where: {
            organizationId: dto.organizationId,
            workerId: employment.workerId,
            type: "UNPAID",
            status: "APPROVED",
            startDate: { lte: dto.periodEnd },
            endDate: { gte: dto.periodStart }
          }
        });

        const unpaidDays = unpaidLeaves.reduce((sum, leave) => sum + Number(leave.days), 0);
        if (unpaidDays > 0) {
          const assumedMonthlyWorkDays = 22;
          await tx.payrollItem.create({
            data: {
              payrollCycleId: cycle.id,
              workerId: employment.workerId,
              employmentRecordId: employment.id,
              type: "DEDUCTION",
              description: `${employment.worker.legalName} unpaid leave deduction (${unpaidDays} days)`,
              amountMinor: -Math.round((employment.salaryAmountMinor / assumedMonthlyWorkDays) * unpaidDays),
              currency: employment.salaryCurrency
            }
          });
        }

        const approvedExpenses = await tx.expense.findMany({
          where: {
            organizationId: dto.organizationId,
            workerId: employment.workerId,
            status: "APPROVED_FOR_PAYROLL",
            payrollCycleId: null,
            currency: employment.salaryCurrency
          }
        });

        for (const expense of approvedExpenses) {
          await tx.payrollItem.create({
            data: {
              payrollCycleId: cycle.id,
              workerId: employment.workerId,
              employmentRecordId: employment.id,
              type: "EXPENSE_REIMBURSEMENT",
              description: `${employment.worker.legalName} expense reimbursement: ${expense.description}`,
              amountMinor: expense.amountMinor,
              currency: expense.currency
            }
          });
        }

        if (approvedExpenses.length > 0) {
          await tx.expense.updateMany({
            where: { id: { in: approvedExpenses.map((expense) => expense.id) } },
            data: { payrollCycleId: cycle.id }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          organizationId: dto.organizationId,
          actorId: context.actorId ?? null,
          action: "payroll_cycle.created",
          entityType: "PayrollCycle",
          entityId: cycle.id,
          after: {
            periodStart: dto.periodStart,
            periodEnd: dto.periodEnd,
            employmentCount: employments.length
          }
        }
      });

      return tx.payrollCycle.findUniqueOrThrow({
        where: { id: cycle.id },
        include: { items: { include: { worker: true } } }
      });
    });

    return result;
  }

  async advance(context: RequestContext, id: string, nextStatus: keyof typeof payrollCycleTransitions) {
    const before = await this.prisma.payrollCycle.findUniqueOrThrow({
      where: { id },
      include: { items: true }
    });
    assertTransition(payrollCycleTransitions, before.status, nextStatus);

    if (["CLIENT_REVIEW", "APPROVED", "LOCKED"].includes(nextStatus) && before.items.length === 0) {
      throw new BadRequestException("Payroll cycle cannot advance without payroll items.");
    }

    if (!isPayrollCycleEditable(before.status) && nextStatus !== "PROCESSED" && nextStatus !== "CLOSED") {
      throw new BadRequestException(`Payroll cycle is not editable from ${before.status}.`);
    }

    const cycle = await this.prisma.payrollCycle.update({
      where: { id },
      data: { status: nextStatus },
      include: { items: true, invoice: true }
    });

    await this.audit.log({
      context: { ...context, organizationId: cycle.organizationId },
      action: "payroll_cycle.status_changed",
      entityType: "PayrollCycle",
      entityId: id,
      before: { status: before.status },
      after: { status: cycle.status }
    });

    return cycle;
  }

  async assertEditable(payrollCycleId: string) {
    const cycle = await this.prisma.payrollCycle.findUniqueOrThrow({ where: { id: payrollCycleId } });
    if (!isPayrollCycleEditable(cycle.status)) {
      throw new BadRequestException(`Payroll cycle ${payrollCycleId} is locked and cannot be edited.`);
    }
    return cycle;
  }
}
