import { BadRequestException, Injectable } from "@nestjs/common";
import { assertTransition, hireRequestTransitions } from "@globalwork/domain";
import type { RequestContext } from "../../common/request-context";
import { AuditService } from "../prisma/services/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { CreateHireRequestDto } from "./dto/create-hire-request.dto";

@Injectable()
export class HiringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService
  ) {}

  list(organizationId?: string) {
    return this.prisma.hireRequest.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { createdAt: "desc" },
      include: { worker: true, organization: true }
    });
  }

  async create(context: RequestContext, dto: CreateHireRequestDto) {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: dto.organizationId }
    });

    if (organization.status !== "APPROVED") {
      throw new BadRequestException("Organization must be approved before creating hire requests.");
    }

    const country = await this.prisma.countryProfile.findUniqueOrThrow({
      where: { countryCode: dto.countryCode }
    });

    if (country.defaultCurrency !== dto.salaryCurrency) {
      throw new BadRequestException(`Salary currency for ${dto.countryCode} must be ${country.defaultCurrency}.`);
    }

    const hireRequest = await this.prisma.hireRequest.create({
      data: {
        organizationId: dto.organizationId,
        workerLegalName: dto.workerLegalName,
        workerEmail: dto.workerEmail,
        countryCode: dto.countryCode,
        jobTitle: dto.jobTitle,
        department: dto.department ?? null,
        managerName: dto.managerName ?? null,
        startDate: dto.startDate,
        salaryAmountMinor: dto.salaryAmountMinor,
        salaryCurrency: dto.salaryCurrency,
        workLocation: dto.workLocation
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: dto.organizationId },
      action: "hire_request.created",
      entityType: "HireRequest",
      entityId: hireRequest.id,
      after: hireRequest
    });

    return hireRequest;
  }

  async submit(context: RequestContext, id: string) {
    const before = await this.prisma.hireRequest.findUniqueOrThrow({ where: { id } });
    assertTransition(hireRequestTransitions, before.status, "SUBMITTED");

    const hireRequest = await this.prisma.hireRequest.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date()
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: hireRequest.organizationId },
      action: "hire_request.submitted",
      entityType: "HireRequest",
      entityId: id,
      before,
      after: hireRequest
    });

    return hireRequest;
  }

  async approveForWorker(context: RequestContext, id: string) {
    const before = await this.prisma.hireRequest.findUniqueOrThrow({ where: { id } });

    if (!["SUBMITTED", "INTERNAL_REVIEW"].includes(before.status)) {
      throw new BadRequestException(`Hire request cannot be approved from ${before.status}.`);
    }

    const country = await this.prisma.countryProfile.findUniqueOrThrow({
      where: { countryCode: before.countryCode }
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const worker = await tx.worker.create({
        data: {
          organizationId: before.organizationId,
          hireRequestId: before.id,
          legalName: before.workerLegalName,
          email: before.workerEmail,
          countryCode: before.countryCode,
          status: "ONBOARDING",
          profile: {
            create: {}
          }
        }
      });

      const employment = await tx.employmentRecord.create({
        data: {
          organizationId: before.organizationId,
          workerId: worker.id,
          countryCode: before.countryCode,
          jobTitle: before.jobTitle,
          department: before.department ?? null,
          managerName: before.managerName ?? null,
          status: "PREBOARDING",
          salaryAmountMinor: before.salaryAmountMinor,
          salaryCurrency: before.salaryCurrency,
          employerCostRateBps: country.employerCostRateBps,
          startDate: before.startDate
        }
      });

      const hireRequest = await tx.hireRequest.update({
        where: { id },
        data: {
          status: "WORKER_ONBOARDING",
          approvedAt: new Date()
        },
        include: { worker: true }
      });

      await tx.auditLog.create({
        data: {
          organizationId: before.organizationId,
          actorId: context.actorId ?? null,
          action: "hire_request.approved_for_worker",
          entityType: "HireRequest",
          entityId: id,
          before,
          after: hireRequest
        }
      });

      return { hireRequest, worker, employment };
    });

    await this.notifications.createAndQueue({
      organizationId: before.organizationId,
      type: "worker_onboarding_invited",
      subject: "Worker onboarding started",
      body: `${before.workerLegalName} can now complete onboarding for ${before.countryCode}.`
    });

    return result;
  }
}
