import { BadRequestException, Injectable } from "@nestjs/common";
import type { DocumentStatus, Prisma } from "@prisma/client";
import { pagedResponse, parsePagination, type PaginationQuery } from "../../common/pagination";
import type { RequestContext } from "../../common/request-context";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { CreateDocumentUploadIntentDto } from "./dto/create-document-upload-intent.dto";
import { CompleteDocumentUploadDto } from "./dto/complete-document-upload.dto";
import { ReviewDocumentDto } from "./dto/review-document.dto";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService
  ) {}

  async reviewQueue(query: PaginationQuery & { organizationId?: string; status?: string }) {
    const pagination = parsePagination(query);
    const where: Prisma.DocumentWhereInput = {
      ...(query.status ? { status: query.status as DocumentStatus } : { status: { in: ["UPLOADED", "PENDING_REVIEW", "REJECTED"] } }),
      ...(query.organizationId ? { worker: { organizationId: query.organizationId } } : {})
    };

    const [documents, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: {
          worker: true,
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 3,
            include: { reviewer: true }
          }
        }
      }),
      this.prisma.document.count({ where })
    ]);

    return pagedResponse(documents, total, pagination);
  }

  async create(context: RequestContext, workerId: string, dto: CreateDocumentDto) {
    const worker = await this.prisma.worker.findUniqueOrThrow({ where: { id: workerId } });
    const document = await this.prisma.document.create({
      data: {
        workerId,
        type: dto.type,
        title: dto.title,
        storageKey: dto.storageKey,
        ...(dto.expiresAt ? { expiresAt: new Date(dto.expiresAt) } : {})
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: worker.organizationId },
      action: "document.uploaded",
      entityType: "Document",
      entityId: document.id,
      after: document
    });

    return document;
  }

  async createUploadIntent(context: RequestContext, workerId: string, dto: CreateDocumentUploadIntentDto) {
    const worker = await this.prisma.worker.findUniqueOrThrow({ where: { id: workerId } });
    const storageKey = documentStorageKey(workerId, dto.type, dto.fileName);
    const upload = await this.storage.createUploadIntent({
      key: storageKey,
      contentType: dto.contentType
    });

    const document = await this.prisma.document.create({
      data: {
        workerId,
        type: dto.type,
        title: dto.title,
        fileName: dto.fileName,
        contentType: dto.contentType,
        storageKey,
        status: "PENDING_UPLOAD"
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: worker.organizationId },
      action: "document.upload_intent_created",
      entityType: "Document",
      entityId: document.id,
      after: {
        type: document.type,
        title: document.title,
        storageKey: document.storageKey,
        contentType: dto.contentType
      }
    });

    return {
      document,
      upload
    };
  }

  async completeUpload(context: RequestContext, id: string, dto: CompleteDocumentUploadDto) {
    const before = await this.prisma.document.findUniqueOrThrow({
      where: { id },
      include: { worker: true }
    });

    if (before.status !== "PENDING_UPLOAD") {
      throw new BadRequestException(`Document upload cannot be completed from ${before.status}.`);
    }

    const verification = await this.storage.verifyObjectExists(before.storageKey);
    if (!verification.exists) {
      throw new BadRequestException(`Upload object was not found for key ${before.storageKey}.`);
    }

    const document = await this.prisma.document.update({
      where: { id },
      data: {
        status: "UPLOADED",
        sizeBytes: dto.sizeBytes,
        checksumSha256: dto.checksumSha256 ?? null,
        uploadedAt: new Date()
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: before.worker.organizationId },
      action: "document.upload_completed",
      entityType: "Document",
      entityId: document.id,
      before: { status: before.status },
      after: {
        status: document.status,
        sizeBytes: document.sizeBytes,
        checksumSha256: document.checksumSha256,
        storageVerification: verification
      }
    });

    return document;
  }

  async review(context: RequestContext, id: string, dto: ReviewDocumentDto) {
    if (dto.status === "REJECTED" && !dto.reason) {
      throw new BadRequestException("Rejected documents require a reason.");
    }

    const before = await this.prisma.document.findUniqueOrThrow({
      where: { id },
      include: { worker: true }
    });

    if (!["UPLOADED", "PENDING_REVIEW"].includes(before.status)) {
      throw new BadRequestException("Document must be uploaded before review.");
    }
    const reviewerId =
      context.actorId ??
      (
        await this.prisma.user.findFirst({
          where: { platformRole: "PLATFORM_ADMIN" }
        })
      )?.id;

    if (!reviewerId) {
      throw new BadRequestException("Document review requires an internal reviewer.");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const document = await tx.document.update({
        where: { id },
        data: { status: dto.status }
      });

      const review = await tx.documentReview.create({
        data: {
          documentId: id,
          reviewerId,
          status: dto.status,
          reason: dto.reason ?? null
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: before.worker.organizationId,
          actorId: context.actorId ?? null,
          action: "document.reviewed",
          entityType: "Document",
          entityId: id,
          before: { status: before.status },
          after: { status: dto.status, reason: dto.reason ?? null }
        }
      });

      return { document, review };
    });

    return result;
  }
}

function documentStorageKey(workerId: string, type: string, fileName: string): string {
  const safeName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `workers/${workerId}/documents/${Date.now()}-${type.toLowerCase()}-${safeName || "document"}`;
}
