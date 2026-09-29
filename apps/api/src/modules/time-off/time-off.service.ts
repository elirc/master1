import { BadRequestException, Injectable } from "@nestjs/common";
import { assertTransition, timeOffTransitions } from "@globalwork/domain";
import type { RequestContext } from "../../common/request-context";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { CreateTimeOffRequestDto } from "./dto/create-time-off-request.dto";
import { ReviewTimeOffRequestDto } from "./dto/review-time-off-request.dto";

@Injectable()
export class TimeOffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list(organizationId: string) {
    return this.prisma.timeOffRequest.findMany({
      where: { organizationId },
      orderBy: { startDate: "desc" },
      include: { worker: true }
    });
  }

  async balances(workerId: string, year: number) {
    await this.ensureVacationBalance(workerId, year);
    return this.prisma.timeOffBalance.findMany({
      where: { workerId, year },
      orderBy: { type: "asc" }
    });
  }

  async create(context: RequestContext, workerId: string, dto: CreateTimeOffRequestDto) {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException("Time off end date must be on or after the start date.");
    }

    const worker = await this.prisma.worker.findUniqueOrThrow({ where: { id: workerId } });
    const request = await this.prisma.timeOffRequest.create({
      data: {
        organizationId: worker.organizationId,
        workerId,
        type: dto.type,
        startDate: dto.startDate,
        endDate: dto.endDate,
        days: dto.days,
        note: dto.note ?? null
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: worker.organizationId },
      action: "time_off.requested",
      entityType: "TimeOffRequest",
      entityId: request.id,
      after: request
    });

    return request;
  }

  async review(context: RequestContext, id: string, dto: ReviewTimeOffRequestDto) {
    const before = await this.prisma.timeOffRequest.findUniqueOrThrow({
      where: { id },
      include: { worker: true }
    });
    assertTransition(timeOffTransitions, before.status, dto.status);
    if (dto.status === "APPROVED" && before.type === "VACATION") {
      const year = before.startDate.getFullYear();
      const balance = await this.ensureVacationBalance(before.workerId, year);
      const usedAfter = Number(balance.usedDays) + Number(before.days);
      if (usedAfter > Number(balance.allowanceDays)) {
        throw new BadRequestException("Approving this request would exceed the worker's vacation balance.");
      }
    }

    const request = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.timeOffRequest.update({
        where: { id },
        data: {
          status: dto.status,
          decisionReason: dto.decisionReason ?? null,
          reviewedById: context.actorId ?? null,
          reviewedAt: new Date()
        }
      });

      if (dto.status === "APPROVED" && before.type === "VACATION") {
        await tx.timeOffBalance.update({
          where: {
            workerId_year_type: {
              workerId: before.workerId,
              year: before.startDate.getFullYear(),
              type: "VACATION"
            }
          },
          data: { usedDays: { increment: before.days } }
        });
      }

      return updated;
    });

    await this.audit.log({
      context: { ...context, organizationId: request.organizationId },
      action: "time_off.reviewed",
      entityType: "TimeOffRequest",
      entityId: request.id,
      before: { status: before.status },
      after: { status: request.status, decisionReason: request.decisionReason }
    });

    return request;
  }

  private async ensureVacationBalance(workerId: string, year: number) {
    const worker = await this.prisma.worker.findUniqueOrThrow({ where: { id: workerId } });
    const country = await this.prisma.countryProfile.findUniqueOrThrow({
      where: { countryCode: worker.countryCode }
    });

    return this.prisma.timeOffBalance.upsert({
      where: {
        workerId_year_type: {
          workerId,
          year,
          type: "VACATION"
        }
      },
      update: {},
      create: {
        workerId,
        year,
        type: "VACATION",
        allowanceDays: country.annualPtoDays
      }
    });
  }
}
