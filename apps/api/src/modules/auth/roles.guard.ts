import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { OrganizationMemberRole, PlatformRole } from "@prisma/client";
import type { AuthenticatedRequest } from "./auth.types";
import { ORGANIZATION_ROLES_KEY, PLATFORM_ROLES_KEY } from "./roles.decorators";
import { canAccessOrganization } from "./tenant-scope";

@Injectable()
export class PlatformRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PlatformRole[]>(PLATFORM_ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.auth?.platformRole;
    if (role && required.includes(role)) {
      return true;
    }

    throw new ForbiddenException("A platform role with sufficient permission is required.");
  }
}

@Injectable()
export class OrganizationRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<OrganizationMemberRole[]>(ORGANIZATION_ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.auth) {
      throw new ForbiddenException("Authentication context is required.");
    }

    if (request.auth?.platformRole === "PLATFORM_ADMIN") {
      return true;
    }

    const organizationId = organizationIdFromRequest(request);
    if (!organizationId) {
      throw new ForbiddenException("Organization context is required for this action.");
    }

    if (!canAccessOrganization(request.auth, organizationId)) {
      throw new ForbiddenException("You do not have access to this organization.");
    }

    const membership = request.auth.memberships.find((item) => item.organizationId === organizationId);
    if (membership && required.includes(membership.role)) {
      request.auth = { ...request.auth, organizationId };
      return true;
    }

    throw new ForbiddenException("An organization role with sufficient permission is required.");
  }
}

function organizationIdFromRequest(request: AuthenticatedRequest): string | undefined {
  const fromHeader = request.headers["x-organization-id"];
  if (Array.isArray(fromHeader)) {
    return fromHeader[0];
  }
  if (typeof fromHeader === "string") {
    return fromHeader;
  }

  const bodyValue = request.body?.organizationId;
  if (typeof bodyValue === "string") {
    return bodyValue;
  }

  const queryValue = request.query?.organizationId;
  if (typeof queryValue === "string") {
    return queryValue;
  }

  const paramOrganizationId = request.params?.organizationId;
  if (typeof paramOrganizationId === "string") {
    return paramOrganizationId;
  }

  const paramId = request.params?.id;
  if (typeof paramId === "string") {
    return paramId;
  }

  return undefined;
}
