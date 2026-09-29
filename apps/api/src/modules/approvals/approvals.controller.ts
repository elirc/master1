import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequirePlatformRoles } from "../auth/roles.decorators";
import { PlatformRoleGuard } from "../auth/roles.guard";
import { ApprovalsService } from "./approvals.service";
import { CreateApprovalStepsDto } from "./dto/create-approval-steps.dto";
import { CreateApprovalWorkflowDto } from "./dto/create-approval-workflow.dto";
import { ReviewApprovalStepDto } from "./dto/review-approval-step.dto";

@Controller("approvals")
@UseGuards(AuthGuard, PlatformRoleGuard)
@RequirePlatformRoles("PLATFORM_ADMIN", "SUPPORT_AGENT")
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get("workflows")
  listWorkflows(@Query("organizationId") organizationId: string) {
    return this.approvals.listWorkflows(organizationId);
  }

  @Post("workflows")
  createWorkflow(@Req() request: AuthenticatedRequest, @Body() dto: CreateApprovalWorkflowDto) {
    return this.approvals.createWorkflow(contextFromRequest(request), dto);
  }

  @Post("steps")
  createSteps(@Req() request: AuthenticatedRequest, @Body() dto: CreateApprovalStepsDto) {
    return this.approvals.createSteps(contextFromRequest(request), dto);
  }

  @Patch("steps/:id/review")
  reviewStep(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: ReviewApprovalStepDto) {
    return this.approvals.reviewStep(contextFromRequest(request), id, dto);
  }
}
