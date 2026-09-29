import type { OrganizationMemberRole, PlatformRole } from "@prisma/client";

export interface AuthMembership {
  organizationId: string;
  role: OrganizationMemberRole;
}

export interface AuthenticatedPrincipal {
  userId: string;
  email: string;
  name: string;
  platformRole: PlatformRole | null;
  memberships: AuthMembership[];
  organizationId?: string;
}

export interface AuthenticatedRequest {
  auth?: AuthenticatedPrincipal;
  headers: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}
