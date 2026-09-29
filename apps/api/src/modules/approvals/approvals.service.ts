import { BadRequestException, Injectable } from "@nestjs/common";
import type { OrganizationMemberRole } from "@prisma/client";
import type { RequestContext } from "../../common/request-context";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { CreateApprovalStepsDto } from "./dto/create-approval-steps.dto";
import { CreateApprovalWorkflowDto } from "./dto/create-approval-workflow.dto";
import { ReviewApprovalStepDto } from "./dto/review-approval-step.dto";

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  listWorkflows(organizationId: string) {
    return this.prisma.approvalWorkflow.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { steps: true }
    });
  }

  async createWorkflow(context: RequestContext, dto: CreateApprovalWorkflowDto) {
    const workflow = await this.prisma.approvalWorkflow.create({
      data: {
        organizationId: dto.organizationId,
        entityType: dto.entityType,
        name: dto.name,
        requiredRoles: dto.requiredRoles
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: dto.organizationId },
      action: "approval_workflow.created",
      entityType: "ApprovalWorkflow",
      entityId: workflow.id,
      after: { entityType: workflow.entityType, requiredRoles: workflow.requiredRoles }
    });

    return workflow;
  }

  async createSteps(context: RequestContext, dto: CreateApprovalStepsDto) {
    const workflow = await this.prisma.approvalWorkflow.findUniqueOrThrow({ where: { id: dto.workflowId } });
    const roles = Array.isArray(workflow.requiredRoles) ? workflow.requiredRoles : [];
    if (roles.length === 0) {
      throw new BadRequestException("Approval workflow requires at least one role.");
    }

    const steps = await this.prisma.$transaction(
      roles.map((role, index) =>
        this.prisma.approvalStep.create({
          data: {
            workflowId: workflow.id,
            organizationId: workflow.organizationId,
            entityType: workflow.entityType,
            entityId: dto.entityId,
            sequence: index + 1,
            requiredRole: role as OrganizationMemberRole
          }
        })
      )
    );

    await this.audit.log({
      context: { ...context, organizationId: workflow.organizationId },
      action: "approval_steps.created",
      entityType: workflow.entityType,
      entityId: dto.entityId,
      after: { stepCount: steps.length }
    });

    return steps;
  }

  async reviewStep(context: RequestContext, id: string, dto: ReviewApprovalStepDto) {
    const before = await this.prisma.approvalStep.findUniqueOrThrow({ where: { id } });
    if (before.status !== "PENDING") {
      throw new BadRequestException(`Approval step cannot be reviewed from ${before.status}.`);
    }

    const step = await this.prisma.approvalStep.update({
      where: { id },
      data: {
        status: dto.status,
        decisionReason: dto.decisionReason ?? null,
        decidedById: context.actorId ?? null,
        decidedAt: new Date()
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: step.organizationId },
      action: "approval_step.reviewed",
      entityType: "ApprovalStep",
      entityId: step.id,
      before: { status: before.status },
      after: { status: step.status }
    });

    return step;
  }
}
