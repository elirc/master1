import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequirePlatformRoles } from "../auth/roles.decorators";
import { PlatformRoleGuard } from "../auth/roles.guard";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { CreateDocumentUploadIntentDto } from "./dto/create-document-upload-intent.dto";
import { CompleteDocumentUploadDto } from "./dto/complete-document-upload.dto";
import { ReviewDocumentDto } from "./dto/review-document.dto";
import { DocumentsService } from "./documents.service";

@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get("documents/review-queue")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "ONBOARDING_SPECIALIST", "COMPLIANCE_REVIEWER")
  reviewQueue(
    @Query("organizationId") organizationId?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    const query: { organizationId?: string; status?: string; page?: string; pageSize?: string } = {};
    if (organizationId) query.organizationId = organizationId;
    if (status) query.status = status;
    if (page) query.page = page;
    if (pageSize) query.pageSize = pageSize;
    return this.documents.reviewQueue(query);
  }

  @Post("workers/:workerId/documents")
  @UseGuards(AuthGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Param("workerId") workerId: string,
    @Body() dto: CreateDocumentDto
  ) {
    return this.documents.create(contextFromRequest(request), workerId, dto);
  }

  @Post("workers/:workerId/documents/upload-intent")
  @UseGuards(AuthGuard)
  createUploadIntent(
    @Req() request: AuthenticatedRequest,
    @Param("workerId") workerId: string,
    @Body() dto: CreateDocumentUploadIntentDto
  ) {
    return this.documents.createUploadIntent(contextFromRequest(request), workerId, dto);
  }

  @Patch("documents/:id/review")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN", "ONBOARDING_SPECIALIST", "COMPLIANCE_REVIEWER")
  review(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: ReviewDocumentDto
  ) {
    return this.documents.review(contextFromRequest(request), id, dto);
  }

  @Patch("documents/:id/complete-upload")
  @UseGuards(AuthGuard)
  completeUpload(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: CompleteDocumentUploadDto
  ) {
    return this.documents.completeUpload(contextFromRequest(request), id, dto);
  }
}
