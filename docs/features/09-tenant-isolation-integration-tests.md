# Feature 09 - Tenant Isolation Integration Tests

## Plan

### Goal

Add an integration-test path that verifies tenant isolation behavior against a real PostgreSQL database through Testcontainers.

### Impacted Codebase Areas

- `apps/api/package.json`: add `test:integration` script and test-utils dependency.
- `apps/api/jest.integration.config.cjs`: separate integration test config.
- `apps/api/src/modules/auth/tenant-scope.ts`: add query-scope helper.
- `apps/api/src/modules/auth/tenant-isolation.integration.spec.ts`: real database integration test.
- `docs/features/09-tenant-isolation-integration-tests.md`: plan and build journal.

### Implementation Approach

1. Keep normal `pnpm test` fast and unit-focused.
2. Add `test:integration` for tests that need Docker/Postgres.
3. Use `@globalwork/test-utils` to start a PostgreSQL container.
4. Push the Prisma schema into the temporary database.
5. Seed two organizations and a user with membership in only one organization.
6. Apply the tenant-scope helper to a real Prisma query and prove only accessible data is returned.

### Design Considerations

- Integration tests are opt-in because Docker may not always be running.
- The test validates real Prisma/Postgres behavior, not only pure TypeScript logic.
- Later endpoint-level tests should boot the Nest app and call HTTP routes, but this database-level test is a useful first step.

## Build Journal

Added a separate Jest integration configuration so the normal test command stays fast while still giving the codebase a realistic path for Docker-backed PostgreSQL tests. The new `apps/api/jest.integration.config.cjs` looks for `*.integration.spec.ts` files and can be run through the API package's `test:integration` script.

The tenant-scope logic gained `organizationWhereForPrincipal()` in `apps/api/src/modules/auth/tenant-scope.ts`. This converts an authenticated principal into a Prisma `OrganizationWhereInput`-style object. Platform admins get an empty filter, while organization users get an `id in [...]` filter containing only their memberships.

The integration test starts a PostgreSQL Testcontainer through `@globalwork/test-utils`, pushes the Prisma schema into that temporary database, creates an allowed organization and a blocked organization, then proves the query helper only returns the allowed one. The test is opt-in behind `RUN_INTEGRATION_TESTS=1` so local unit tests do not require Docker by default.

The key lesson is to test the risk at the right layer. A pure unit test can prove the helper returns a JavaScript object. The integration test proves that object behaves correctly when used by Prisma against a real SQL database.
