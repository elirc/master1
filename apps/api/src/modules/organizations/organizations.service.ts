import { Injectable } from "@nestjs/common";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { RequestContext } from "../../common/request-context";
import { hashPassword } from "../auth/password";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { InviteOrganizationMemberDto } from "./dto/invite-organization-member.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";
import { UpsertBillingAccountDto } from "./dto/upsert-billing-account.dto";

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { members: { include: { user: true } } }
    });
  }

  async create(context: RequestContext, dto: CreateOrganizationDto) {
    const organization = await this.prisma.organization.create({
      data: {
        legalName: dto.legalName,
        tradeName: dto.tradeName ?? null,
        billingEmail: dto.billingEmail,
        billingCurrency: dto.billingCurrency,
        countryCode: dto.countryCode
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: organization.id },
      action: "organization.created",
      entityType: "Organization",
      entityId: organization.id,
      after: organization
    });

    return organization;
  }

  async approve(context: RequestContext, id: string) {
    const before = await this.prisma.organization.findUniqueOrThrow({ where: { id } });
    const organization = await this.prisma.organization.update({
      where: { id },
      data: { status: "APPROVED" }
    });

    await this.audit.log({
      context: { ...context, organizationId: organization.id },
      action: "organization.approved",
      entityType: "Organization",
      entityId: organization.id,
      before,
      after: organization
    });

    return organization;
  }

  async billingAccount(organizationId: string) {
    const organization = await this.prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
    return this.prisma.billingAccount.upsert({
      where: { organizationId },
      update: {},
      create: {
        organizationId,
        billingContactEmail: organization.billingEmail,
        invoiceCurrency: organization.billingCurrency
      }
    });
  }

  async upsertBillingAccount(context: RequestContext, organizationId: string, dto: UpsertBillingAccountDto) {
    const before = await this.prisma.billingAccount.findUnique({ where: { organizationId } });
    const account = await this.prisma.billingAccount.upsert({
      where: { organizationId },
      update: {
        billingContactName: dto.billingContactName ?? null,
        billingContactEmail: dto.billingContactEmail ?? null,
        taxId: dto.taxId ?? null,
        paymentTermsDays: dto.paymentTermsDays,
        invoiceCurrency: dto.invoiceCurrency,
        purchaseOrderRequired: dto.purchaseOrderRequired,
        purchaseOrderNumber: dto.purchaseOrderNumber ?? null
      },
      create: {
        organizationId,
        billingContactName: dto.billingContactName ?? null,
        billingContactEmail: dto.billingContactEmail ?? null,
        taxId: dto.taxId ?? null,
        paymentTermsDays: dto.paymentTermsDays,
        invoiceCurrency: dto.invoiceCurrency,
        purchaseOrderRequired: dto.purchaseOrderRequired,
        purchaseOrderNumber: dto.purchaseOrderNumber ?? null
      }
    });

    await this.audit.log({
      context: { ...context, organizationId },
      action: "organization.billing_account_updated",
      entityType: "BillingAccount",
      entityId: account.id,
      ...(before ? { before: { invoiceCurrency: before.invoiceCurrency, paymentTermsDays: before.paymentTermsDays } } : {}),
      after: { invoiceCurrency: account.invoiceCurrency, paymentTermsDays: account.paymentTermsDays }
    });

    return account;
  }

  listMembers(organizationId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { user: true }
    });
  }

  listInvitations(organizationId: string) {
    return this.prisma.invitation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { invitedBy: true }
    });
  }

  async inviteMember(context: RequestContext, organizationId: string, dto: InviteOrganizationMemberDto) {
    await this.prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        token: randomUUID(),
        invitedById: context.actorId ?? null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    await this.audit.log({
      context: { ...context, organizationId },
      action: "organization.invitation_created",
      entityType: "Invitation",
      entityId: invitation.id,
      after: { email: invitation.email, role: invitation.role, status: invitation.status }
    });

    return invitation;
  }

  async acceptInvitation(token: string, dto: AcceptInvitationDto) {
    const invitation = await this.prisma.invitation.findUnique({ where: { token } });
    if (!invitation) {
      throw new NotFoundException("Invitation not found.");
    }

    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      throw new BadRequestException("Invitation is no longer valid.");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: invitation.email },
        update: {
          name: dto.name,
          passwordHash: hashPassword(dto.password)
        },
        create: {
          email: invitation.email,
          name: dto.name,
          passwordHash: hashPassword(dto.password)
        }
      });

      const membership = await tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: user.id
          }
        },
        update: { role: invitation.role },
        create: {
          organizationId: invitation.organizationId,
          userId: user.id,
          role: invitation.role
        }
      });

      const accepted = await tx.invitation.update({
        where: { token },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: invitation.organizationId,
          actorId: user.id,
          action: "organization.invitation_accepted",
          entityType: "Invitation",
          entityId: invitation.id,
          after: { email: invitation.email, role: invitation.role }
        }
      });

      return { invitation: accepted, user, membership };
    });

    return result;
  }

  async revokeInvitation(context: RequestContext, token: string) {
    const before = await this.prisma.invitation.findUniqueOrThrow({ where: { token } });
    const invitation = await this.prisma.invitation.update({
      where: { token },
      data: { status: "REVOKED" }
    });

    await this.audit.log({
      context: { ...context, organizationId: invitation.organizationId },
      action: "organization.invitation_revoked",
      entityType: "Invitation",
      entityId: invitation.id,
      before: { status: before.status },
      after: { status: invitation.status }
    });

    return invitation;
  }

  async updateMemberRole(
    context: RequestContext,
    organizationId: string,
    memberId: string,
    dto: UpdateMemberRoleDto
  ) {
    const before = await this.prisma.organizationMember.findFirstOrThrow({
      where: { id: memberId, organizationId }
    });
    const membership = await this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: { user: true }
    });

    await this.audit.log({
      context: { ...context, organizationId },
      action: "organization.member_role_changed",
      entityType: "OrganizationMember",
      entityId: memberId,
      before: { role: before.role },
      after: { role: membership.role, userId: membership.userId }
    });

    return membership;
  }
}
