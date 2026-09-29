import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { parseCsv } from "../../common/csv";
import type { RequestContext } from "../../common/request-context";
import { containsSearch, normalizeSearchTerm } from "../../common/search";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { CompleteWorkerProfileDto } from "./dto/complete-worker-profile.dto";
import { CreateProfileEditRequestDto } from "./dto/create-profile-edit-request.dto";
import { ImportWorkersCsvDto } from "./dto/import-workers-csv.dto";
import { ReviewProfileEditRequestDto } from "./dto/review-profile-edit-request.dto";

@Injectable()
export class WorkersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list(organizationId?: string, search?: string) {
    const term = normalizeSearchTerm(search);
    return this.prisma.worker.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        ...(term
          ? {
              OR: [
                { legalName: containsSearch(term) },
                { email: containsSearch(term) },
                { countryCode: containsSearch(term) }
              ]
            }
          : {})
      },
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
        documents: true,
        employment: true,
        hireRequest: true
      }
    });
  }

  listProfileEditRequests(workerId: string) {
    return this.prisma.workerProfileEditRequest.findMany({
      where: { workerId },
      orderBy: { createdAt: "desc" },
      include: { requestedBy: true, reviewedBy: true }
    });
  }

  async createProfileEditRequest(context: RequestContext, workerId: string, dto: CreateProfileEditRequestDto) {
    const worker = await this.prisma.worker.findUniqueOrThrow({ where: { id: workerId } });
    const request = await this.prisma.workerProfileEditRequest.create({
      data: {
        workerId,
        requestedById: context.actorId ?? null,
        proposedChanges: dto.proposedChanges as Prisma.InputJsonValue
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: worker.organizationId },
      action: "worker.profile_edit_requested",
      entityType: "WorkerProfileEditRequest",
      entityId: request.id,
      after: { proposedChanges: request.proposedChanges }
    });

    return request;
  }

  async reviewProfileEditRequest(context: RequestContext, id: string, dto: ReviewProfileEditRequestDto) {
    const before = await this.prisma.workerProfileEditRequest.findUniqueOrThrow({
      where: { id },
      include: { worker: true }
    });
    if (before.status !== "SUBMITTED") {
      throw new BadRequestException(`Profile edit request cannot be reviewed from ${before.status}.`);
    }
    if (dto.status === "REJECTED" && !dto.decisionReason) {
      throw new BadRequestException("Rejected profile edits require a reason.");
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.workerProfileEditRequest.update({
        where: { id },
        data: {
          status: dto.status,
          decisionReason: dto.decisionReason ?? null,
          reviewedById: context.actorId ?? null,
          reviewedAt: new Date()
        }
      });

      if (dto.status === "APPROVED") {
        await tx.workerProfile.upsert({
          where: { workerId: before.workerId },
          update: profileUpdateData(before.proposedChanges),
          create: {
            workerId: before.workerId,
            ...profileUpdateData(before.proposedChanges)
          }
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: before.worker.organizationId,
          actorId: context.actorId ?? null,
          action: "worker.profile_edit_reviewed",
          entityType: "WorkerProfileEditRequest",
          entityId: id,
          before: { status: before.status },
          after: { status: request.status, decisionReason: request.decisionReason }
        }
      });

      return request;
    });
  }

  async importCsv(context: RequestContext, dto: ImportWorkersCsvDto) {
    const rows = parseCsv(dto.csv);
    const errors: Array<{ row: number; message: string }> = [];
    const validRows = rows.map((row, index) => {
      const required = ["workerLegalName", "workerEmail", "countryCode", "jobTitle", "startDate", "salaryAmountMinor", "workLocation"];
      const missing = required.filter((key) => !row[key]);
      if (missing.length > 0) {
        errors.push({ row: index + 2, message: `Missing ${missing.join(", ")}` });
      }
      return row;
    });

    if (!dto.commit || errors.length > 0) {
      return { commit: false, rows: validRows, errors };
    }

    const organization = await this.prisma.organization.findUniqueOrThrow({ where: { id: dto.organizationId } });
    const created = await this.prisma.$transaction(
      validRows.map((row) =>
        this.prisma.hireRequest.create({
          data: {
            organizationId: organization.id,
            workerLegalName: row.workerLegalName!,
            workerEmail: row.workerEmail!,
            countryCode: row.countryCode!,
            jobTitle: row.jobTitle!,
            startDate: new Date(row.startDate!),
            salaryAmountMinor: Number(row.salaryAmountMinor!),
            salaryCurrency: row.salaryCurrency || organization.billingCurrency,
            workLocation: row.workLocation!,
            department: row.department || null,
            managerName: row.managerName || null
          }
        })
      )
    );

    await this.audit.log({
      context: { ...context, organizationId: organization.id },
      action: "worker.csv_import_committed",
      entityType: "Organization",
      entityId: organization.id,
      after: { importedRows: created.length }
    });

    return { commit: true, created, errors: [] };
  }

  async portal(userId?: string) {
    if (!userId) {
      throw new ForbiddenException("Worker portal requires an authenticated user.");
    }

    const worker = await this.prisma.worker.findFirst({
      where: { userId },
      include: {
        organization: true,
        profile: true,
        documents: { orderBy: { updatedAt: "desc" } },
        employment: true,
        timeOffRequests: { orderBy: { createdAt: "desc" } },
        expenses: { orderBy: { createdAt: "desc" } },
        hireRequest: true
      }
    });

    if (!worker) {
      throw new ForbiddenException("No worker portal is available for this user.");
    }

    return {
      worker,
      onboarding: {
        profileComplete: Boolean(worker.profile?.completedAt),
        approvedDocuments: worker.documents.filter((document) => document.status === "APPROVED").length,
        pendingDocuments: worker.documents.filter((document) => document.status !== "APPROVED").length
      }
    };
  }

  completeProfile(id: string, dto: CompleteWorkerProfileDto) {
    return this.prisma.workerProfile.upsert({
      where: { workerId: id },
      update: {
        ...dto,
        completedAt: new Date()
      },
      create: {
        workerId: id,
        ...dto,
        completedAt: new Date()
      }
    });
  }

  async activate(context: RequestContext, id: string) {
    const worker = await this.prisma.worker.findUniqueOrThrow({
      where: { id },
      include: {
        profile: true,
        documents: true,
        employment: true,
        hireRequest: true
      }
    });

    if (!worker.profile?.completedAt) {
      throw new BadRequestException("Worker profile must be completed before activation.");
    }

    if (!worker.employment) {
      throw new BadRequestException("Worker does not have an employment record.");
    }

    const country = await this.prisma.countryProfile.findUniqueOrThrow({
      where: { countryCode: worker.countryCode }
    });
    const requiredDocuments = country.requiredWorkerDocuments as string[];
    const approvedTypes = new Set(
      worker.documents.filter((document) => document.status === "APPROVED").map((document) => document.type)
    );
    const missingDocuments = requiredDocuments.filter((type) => !approvedTypes.has(type));

    if (missingDocuments.length > 0) {
      throw new BadRequestException(`Worker is missing approved documents: ${missingDocuments.join(", ")}.`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedWorker = await tx.worker.update({
        where: { id },
        data: { status: "ACTIVE" }
      });

      const employment = await tx.employmentRecord.update({
        where: { workerId: id },
        data: { status: "ACTIVE" }
      });

      const hireRequest = await tx.hireRequest.update({
        where: { id: worker.hireRequestId },
        data: { status: "ACTIVE" }
      });

      await tx.auditLog.create({
        data: {
          organizationId: worker.organizationId,
          actorId: context.actorId ?? null,
          action: "worker.activated",
          entityType: "Worker",
          entityId: worker.id,
          before: { status: worker.status },
          after: { status: updatedWorker.status }
        }
      });

      return { worker: updatedWorker, employment, hireRequest };
    });

    return result;
  }
}

function profileUpdateData(value: Prisma.JsonValue) {
  const proposed = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    ...(typeof proposed.addressLine1 === "string" ? { addressLine1: proposed.addressLine1 } : {}),
    ...(typeof proposed.addressLine2 === "string" ? { addressLine2: proposed.addressLine2 } : {}),
    ...(typeof proposed.city === "string" ? { city: proposed.city } : {}),
    ...(typeof proposed.region === "string" ? { region: proposed.region } : {}),
    ...(typeof proposed.postalCode === "string" ? { postalCode: proposed.postalCode } : {}),
    ...(typeof proposed.taxIdentifier === "string" ? { taxIdentifier: proposed.taxIdentifier } : {}),
    ...(typeof proposed.bankLastFour === "string" ? { bankLastFour: proposed.bankLastFour } : {}),
    completedAt: new Date()
  };
}
