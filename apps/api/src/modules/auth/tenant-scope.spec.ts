import type { AuthenticatedPrincipal } from "./auth.types";
import { canAccessOrganization, organizationScopeForPrincipal, requireAccessibleOrganization } from "./tenant-scope";

function principal(overrides: Partial<AuthenticatedPrincipal> = {}): AuthenticatedPrincipal {
  return {
    userId: "user-1",
    email: "user@example.com",
    name: "Example User",
    platformRole: null,
    memberships: [{ organizationId: "org-1", role: "CLIENT_HR_ADMIN" }],
    ...overrides
  };
}

describe("tenant scope helpers", () => {
  it("allows platform admins to access every organization", () => {
    expect(canAccessOrganization(principal({ platformRole: "PLATFORM_ADMIN" }), "org-999")).toBe(true);
  });

  it("allows organization members to access their own organization", () => {
    expect(canAccessOrganization(principal(), "org-1")).toBe(true);
  });

  it("blocks organization members from other organizations", () => {
    expect(canAccessOrganization(principal(), "org-2")).toBe(false);
    expect(() => requireAccessibleOrganization(principal(), "org-2")).toThrow("cannot access organization");
  });

  it("returns all scope for platform admins and specific ids for client users", () => {
    expect(organizationScopeForPrincipal(principal({ platformRole: "PLATFORM_ADMIN" }))).toBe("ALL");
    expect(organizationScopeForPrincipal(principal())).toEqual(["org-1"]);
  });
});
