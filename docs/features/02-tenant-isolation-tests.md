# Feature 02 - Tenant Isolation Enforcement And Tests

## Plan

### Goal

Make tenant isolation more concrete by protecting organization-scoped read endpoints and adding tests around the tenant access rules. The app already has `organizationId` on most business records; this feature starts making that boundary executable.

### Impacted Codebase Areas

- `apps/api/src/modules/auth/*`: add a pure tenant-access helper.
- `apps/api/src/modules/*/*.controller.ts`: protect organization-scoped list endpoints with auth and organization role guards.
- `apps/api/jest.config.cjs`: configure API unit tests with TypeScript.
- `apps/api/src/modules/auth/*.spec.ts`: add tenant access tests.
- `docs/features/02-tenant-isolation-tests.md`: plan and journal for this feature.

### Implementation Approach

1. Add `canAccessOrganization()` and `organizationScopeForPrincipal()` helpers.
2. Use the helper inside `OrganizationRoleGuard`.
3. Require authentication and organization roles for organization-scoped list endpoints.
4. Restrict organization list to platform admins.
5. Add unit tests for platform admin access, same-tenant access, cross-tenant denial, and missing tenant denial.

### Design Considerations

- Tenant isolation must be enforced on the backend. Query parameters are not trust boundaries.
- Platform admins need broad access for internal operations, but client users should only see records for organizations where they have membership.
- This is not yet full integration testing with Postgres; it is a first executable safety net around the authorization rule itself.

## Build Journal

Implemented:

- Added `tenant-scope.ts` with `canAccessOrganization()`, `organizationScopeForPrincipal()`, and `requireAccessibleOrganization()`.
- Updated `OrganizationRoleGuard` to use the tenant access helper before checking role membership.
- Protected organization-scoped list endpoints for hires, workers, payroll cycles, invoices, and notifications.
- Restricted organization listing to platform admins.
- Added Jest configuration for the API package.
- Added unit tests covering platform admin access, same-tenant access, cross-tenant denial, and scope calculation.

Verification:

- Ran `corepack pnpm --filter @globalwork/api test`.
- Ran `corepack pnpm typecheck`.

Lessons learned:

- Tenant isolation is not only a database concern; it also lives in controller guards, request context, query filtering, and tests.
- A pure helper is easier to test than a full Nest guard, so extracting the core access decision gives fast feedback.
- The next maturity step is integration tests that prove actual endpoints cannot leak another tenant's records.
