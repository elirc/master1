# Feature 01 - Real Authentication And Role-Based Authorization

## Plan

### Goal

Replace the purely header-driven demo identity approach with a real authentication surface: password-backed users, signed bearer tokens, `/auth/login`, `/auth/me`, and reusable guards for platform and organization roles.

This is not the final enterprise auth layer. It is a maintainable stepping stone that can later grow into SSO/SAML, refresh tokens, session rotation, and SCIM.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add password hash storage to `User`.
- `packages/database/prisma/seed.ts`: seed local demo users with development passwords.
- `apps/api/src/app.module.ts`: register the new auth module.
- `apps/api/src/common/request-context.ts`: allow request context to come from authenticated request state.
- `apps/api/src/modules/auth/*`: new auth service, controller, DTOs, guards, decorators, and password/token helpers.
- Existing controllers: selected sensitive routes will be protected with auth and role guards.
- `docs/SYSTEM_DESIGN_FORWARD_PLAN.md`: this feature follows the identity boundary described there.

### Implementation Approach

1. Store `passwordHash` on `User`.
2. Use Node's built-in `crypto.scrypt` for password hashing to avoid native bcrypt install friction.
3. Use a small HMAC-signed bearer token format for local development.
4. Add `AuthGuard` that reads `Authorization: Bearer <token>` and attaches authenticated user context to the request.
5. Keep a development fallback for `x-user-id` so existing local workflows remain usable while the frontend catches up.
6. Add `RequirePlatformRoles` and `RequireOrganizationRoles` decorators plus guards.
7. Protect mutation-heavy routes where permissions matter most.

### Design Considerations

- Tokens are intentionally simple and short-lived enough for local development. They should become real JWTs or server-side sessions before production.
- Password hashes are stored, never raw passwords.
- Authorization is split into platform roles and organization roles because internal operators and client users are different authority models.
- Role guards should live in the auth module so future features do not duplicate role logic.

## Build Journal

Implemented:

- Added `passwordHash` to `User`.
- Seeded `admin@globalwork.local` and `owner@acme.example` with the development password `Password123!`.
- Added `/api/auth/register`, `/api/auth/login`, and `/api/auth/me`.
- Added password hashing with Node `crypto.scrypt`.
- Added HMAC-signed bearer tokens using `JWT_SECRET`.
- Added `AuthGuard`, `RequirePlatformRoles`, `RequireOrganizationRoles`, `PlatformRoleGuard`, and `OrganizationRoleGuard`.
- Updated request context so audit logs can use authenticated user context.
- Protected high-risk mutation routes across organizations, hiring, documents, workers, payroll, and invoices.

Verification:

- Ran `corepack pnpm db:generate`.
- Ran `corepack pnpm typecheck`.

Lessons learned:

- Auth is a cross-cutting feature, so it touches more files than most product features.
- Authentication and authorization are separate concerns; keeping token verification separate from role guards made the code easier to reason about.
- Strict TypeScript settings made nullable and optional values more explicit, especially around Prisma create calls and request context.
- The project now has a real identity boundary, but future work should replace the development header fallback with fully authenticated frontend flows and stronger session management.
