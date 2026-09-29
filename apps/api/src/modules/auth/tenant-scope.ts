import type { AuthenticatedPrincipal } from "./auth.types";

export type OrganizationScope = "ALL" | string[];

export function canAccessOrganization(principal: AuthenticatedPrincipal, organizationId: string): boolean {
  if (principal.platformRole === "PLATFORM_ADMIN") {
    return true;
  }

  return principal.memberships.some((membership) => membership.organizationId === organizationId);
}

export function organizationScopeForPrincipal(principal: AuthenticatedPrincipal): OrganizationScope {
  if (principal.platformRole === "PLATFORM_ADMIN") {
    return "ALL";
  }

  return principal.memberships.map((membership) => membership.organizationId);
}

export function organizationWhereForPrincipal(principal: AuthenticatedPrincipal): { id?: { in: string[] } } {
  const scope = organizationScopeForPrincipal(principal);
  if (scope === "ALL") {
    return {};
  }

  return {
    id: {
      in: scope
    }
  };
}

export function requireAccessibleOrganization(principal: AuthenticatedPrincipal, organizationId: string): void {
  if (!canAccessOrganization(principal, organizationId)) {
    throw new Error(`User ${principal.userId} cannot access organization ${organizationId}.`);
  }
}
