import { BadRequestException, Injectable } from "@nestjs/common";
import { assertTransition, expenseTransitions } from "@globalwork/domain";
import type { RequestContext } from "../../common/request-context";
import { PayrollService } from "../payroll/payroll.service";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { AttachExpensePayrollDto } from "./dto/attach-expense-payroll.dto";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { ReviewExpenseDto } from "./dto/review-expense.dto";

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly payroll: PayrollService
  ) {}

  list(organizationId: string) {
    return this.prisma.expense.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { worker: true, payrollCycle: true }
    });
  }

  async create(context: RequestContext, workerId: string, dto: CreateExpenseDto) {
    const worker = await this.prisma.worker.findUniqueOrThrow({ where: { id: workerId } });
    const expense = await this.prisma.expense.create({
      data: {
        organizationId: worker.organizationId,
        workerId,
        category: dto.category,
        description: dto.description,
        amountMinor: dto.amountMinor,
        currency: dto.currency,
        receiptStorageKey: dto.receiptStorageKey ?? null
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: worker.organizationId },
      action: "expense.submitted",
      entityType: "Expense",
      entityId: expense.id,
      after: expense
    });

    return expense;
  }

  async review(context: RequestContext, id: string, dto: ReviewExpenseDto) {
    const before = await this.prisma.expense.findUniqueOrThrow({ where: { id } });
    assertTransition(expenseTransitions, before.status, dto.status);

    if (dto.status === "REJECTED" && !dto.decisionReason) {
      throw new BadRequestException("Rejected expenses require a reason.");
    }

    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        status: dto.status,
        decisionReason: dto.decisionReason ?? null,
        reviewedById: context.actorId ?? null,
        reviewedAt: new Date()
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: expense.organizationId },
      action: "expense.reviewed",
      entityType: "Expense",
      entityId: expense.id,
      before: { status: before.status },
      after: { status: expense.status, decisionReason: expense.decisionReason }
    });

    return expense;
  }

  async markReimbursed(context: RequestContext, id: string) {
    const before = await this.prisma.expense.findUniqueOrThrow({ where: { id } });
    assertTransition(expenseTransitions, before.status, "REIMBURSED");

    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        status: "REIMBURSED",
        reimbursedAt: new Date()
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: expense.organizationId },
      action: "expense.reimbursed",
      entityType: "Expense",
      entityId: expense.id,
      before: { status: before.status },
      after: { status: expense.status }
    });

    return expense;
  }

  async attachPayroll(context: RequestContext, id: string, dto: AttachExpensePayrollDto) {
    const before = await this.prisma.expense.findUniqueOrThrow({
      where: { id },
      include: { worker: { include: { employment: true } } }
    });
    if (before.status !== "APPROVED_FOR_PAYROLL") {
      throw new BadRequestException("Only approved expenses can be attached to payroll.");
    }
    if (!before.worker.employment) {
      throw new BadRequestException("Expense worker does not have an employment record.");
    }
    await this.payroll.assertEditable(dto.payrollCycleId);

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id },
        data: { payrollCycleId: dto.payrollCycleId }
      });

      const payrollItem = await tx.payrollItem.create({
        data: {
          payrollCycleId: dto.payrollCycleId,
          workerId: before.workerId,
          employmentRecordId: before.worker.employment!.id,
          type: "EXPENSE_REIMBURSEMENT",
          description: `Expense reimbursement: ${before.description}`,
          amountMinor: before.amountMinor,
          currency: before.currency
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: before.organizationId,
          actorId: context.actorId ?? null,
          action: "expense.attached_to_payroll",
          entityType: "Expense",
          entityId: id,
          before: { payrollCycleId: before.payrollCycleId },
          after: { payrollCycleId: dto.payrollCycleId, payrollItemId: payrollItem.id }
        }
      });

      return { expense, payrollItem };
    });
  }
}
