import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequirePlatformRoles } from "../auth/roles.decorators";
import { RequireOrganizationRoles } from "../auth/roles.decorators";
import { OrganizationRoleGuard, PlatformRoleGuard } from "../auth/roles.guard";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { InviteOrganizationMemberDto } from "./dto/invite-organization-member.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";
import { UpsertBillingAccountDto } from "./dto/upsert-billing-account.dto";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN")
  list() {
    return this.organizations.list();
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateOrganizationDto) {
    return this.organizations.create(contextFromRequest(request), dto);
  }

  @Patch(":id/approve")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN")
  approve(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.organizations.approve(contextFromRequest(request), id);
  }

  @Get(":id/billing-account")
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_FINANCE")
  billingAccount(@Param("id") id: string) {
    return this.organizations.billingAccount(id);
  }

  @Patch(":id/billing-account")
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_FINANCE")
  upsertBillingAccount(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: UpsertBillingAccountDto
  ) {
    return this.organizations.upsertBillingAccount(contextFromRequest(request), id, dto);
  }

  @Get(":id/members")
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_HR_ADMIN")
  listMembers(@Param("id") id: string) {
    return this.organizations.listMembers(id);
  }

  @Post(":id/invitations")
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_HR_ADMIN")
  invite(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: InviteOrganizationMemberDto
  ) {
    return this.organizations.inviteMember(contextFromRequest(request), id, dto);
  }

  @Get(":id/invitations")
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER", "CLIENT_HR_ADMIN")
  listInvitations(@Param("id") id: string) {
    return this.organizations.listInvitations(id);
  }

  @Patch(":id/members/:memberId/role")
  @UseGuards(AuthGuard, OrganizationRoleGuard)
  @RequireOrganizationRoles("CLIENT_OWNER")
  updateMemberRole(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Body() dto: UpdateMemberRoleDto
  ) {
    return this.organizations.updateMemberRole(contextFromRequest(request), id, memberId, dto);
  }

  @Patch("invitations/:token/revoke")
  @UseGuards(AuthGuard)
  revokeInvitation(@Req() request: AuthenticatedRequest, @Param("token") token: string) {
    return this.organizations.revokeInvitation(contextFromRequest(request), token);
  }

  @Post("invitations/:token/accept")
  acceptInvitation(@Param("token") token: string, @Body() dto: AcceptInvitationDto) {
    return this.organizations.acceptInvitation(token, dto);
  }
}
