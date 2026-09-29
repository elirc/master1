import { BadRequestException, Injectable } from "@nestjs/common";
import type { PayrollItemType } from "@prisma/client";
import { pagedResponse, parsePagination, type PaginationQuery } from "../../common/pagination";
import type { RequestContext } from "../../common/request-context";
import { PayrollService } from "../payroll/payroll.service";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { CreatePayrollAdjustmentDto } from "./dto/create-payroll-adjustment.dto";
import { ReviewPayrollAdjustmentDto } from "./dto/review-payroll-adjustment.dto";

@Injectable()
export class PayrollAdjustmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payroll: PayrollService,
    private readonly audit: AuditService
  ) {}

  async list(query: PaginationQuery & { organizationId: string }) {
    const pagination = parsePagination(query);
    const where = { organizationId: query.organizationId };
    const [adjustments, total] = await this.prisma.$transaction([
      this.prisma.payrollAdjustment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: { worker: true, payrollCycle: true }
      }),
      this.prisma.payrollAdjustment.count({ where })
    ]);

    return pagedResponse(adjustments, total, pagination);
  }

  async create(context: RequestContext, workerId: string, dto: CreatePayrollAdjustmentDto) {
    const worker = await this.prisma.worker.findUniqueOrThrow({ where: { id: workerId } });
    if (dto.payrollCycleId) {
      await this.payroll.assertEditable(dto.payrollCycleId);
    }

    const adjustment = await this.prisma.payrollAdjustment.create({
      data: {
        organizationId: worker.organizationId,
        workerId,
        payrollCycleId: dto.payrollCycleId ?? null,
        kind: dto.kind,
        description: dto.description,
        amountMinor: normalizedAmount(dto.kind, dto.amountMinor),
        currency: dto.currency
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: worker.organizationId },
      action: "payroll_adjustment.created",
      entityType: "PayrollAdjustment",
      entityId: adjustment.id,
      after: adjustment
    });

    return adjustment;
  }

  async review(context: RequestContext, id: string, dto: ReviewPayrollAdjustmentDto) {
    const before = await this.prisma.payrollAdjustment.findUniqueOrThrow({ where: { id } });
    if (before.status !== "SUBMITTED") {
      throw new BadRequestException(`Payroll adjustment cannot be reviewed from ${before.status}.`);
    }

    if (before.payrollCycleId) {
      await this.payroll.assertEditable(before.payrollCycleId);
    }

    return this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.payrollAdjustment.update({
        where: { id },
        data: {
          status: dto.status,
          decisionReason: dto.decisionReason ?? null,
          reviewedById: context.actorId ?? null,
          reviewedAt: new Date()
        }
      });

      if (dto.status === "APPROVED" && adjustment.payrollCycleId) {
        const employment = await tx.employmentRecord.findUniqueOrThrow({
          where: { workerId: adjustment.workerId }
        });
        await tx.payrollItem.create({
          data: {
            payrollCycleId: adjustment.payrollCycleId,
            workerId: adjustment.workerId,
            employmentRecordId: employment.id,
            type: payrollItemType(adjustment.kind),
            description: adjustment.description,
            amountMinor: adjustment.amountMinor,
            currency: adjustment.currency
          }
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: adjustment.organizationId,
          actorId: context.actorId ?? null,
          action: "payroll_adjustment.reviewed",
          entityType: "PayrollAdjustment",
          entityId: adjustment.id,
          before: { status: before.status },
          after: { status: adjustment.status }
        }
      });

      return adjustment;
    });
  }
}

function normalizedAmount(kind: string, amountMinor: number): number {
  return kind === "DEDUCTION" ? -Math.abs(amountMinor) : Math.abs(amountMinor);
}

function payrollItemType(kind: string): PayrollItemType {
  return kind === "DEDUCTION" ? "DEDUCTION" : "BONUS";
}
