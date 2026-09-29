import { SetMetadata } from "@nestjs/common";
import type { OrganizationMemberRole, PlatformRole } from "@prisma/client";

export const PLATFORM_ROLES_KEY = "platformRoles";
export const ORGANIZATION_ROLES_KEY = "organizationRoles";

export function RequirePlatformRoles(...roles: PlatformRole[]) {
  return SetMetadata(PLATFORM_ROLES_KEY, roles);
}

export function RequireOrganizationRoles(...roles: OrganizationMemberRole[]) {
  return SetMetadata(ORGANIZATION_ROLES_KEY, roles);
}
