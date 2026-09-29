# Feature 42 - API End-To-End Tests

## Plan

### Goal

Add a Nest API end-to-end test that boots the app and tests a real HTTP flow.

### Impacted Codebase Areas

- `apps/api/src/app.e2e-spec.ts`: new e2e test.
- `apps/api/package.json`: add test:e2e script if needed.
- `docs/features/42-api-end-to-end-tests.md`: plan and build journal.

### Implementation Approach

1. Use Nest testing utilities to create the app.
2. Test `/api/health`.
3. Keep database-heavy flows for Testcontainers integration tests.
4. Ensure the test closes the Nest app cleanly.
5. Run through normal Jest config.

### Design Considerations

- E2E tests verify module wiring, pipes, middleware, and controllers together.
- Start with a stable health endpoint before testing data-heavy flows.
- Later e2e tests should use isolated databases.

## Build Journal

Added a dedicated Jest e2e config and `src/app.e2e.ts`. The test boots a Nest app with the health module, applies the global prefix and request-id middleware, and verifies `/api/health` over HTTP.

The important design lesson is separate test lanes. E2E tests should not accidentally slow or destabilize the fast unit suite.
