# Feature 24 - Playwright Workflow Tests

## Plan

### Goal

Add browser workflow coverage around login and major dashboard surfaces.

### Impacted Codebase Areas

- `apps/web/e2e/operations-dashboard.spec.ts`: expand smoke coverage.
- `apps/web/app/*`: add stable labels/selectors where needed.
- `docs/features/24-playwright-workflow-tests.md`: plan and build journal.

### Implementation Approach

1. Cover login page rendering and demo shortcut visibility.
2. Cover dashboard shell rendering after a seeded browser session or mocked API flow.
3. Assert key panels are present for admin/finance users.
4. Keep the test resilient to changing data volumes.
5. Document what remains untested until API fixture orchestration improves.

### Design Considerations

- Browser tests should verify user workflows, not implementation details.
- Stable accessible labels are better than fragile CSS selectors.
- This first test slice should be small enough to maintain.

## Build Journal

Expanded Playwright coverage to include the login page and an authenticated admin dashboard render. The dashboard test seeds local storage and mocks API responses, which lets the UI be tested without requiring a running seeded backend.

The test now checks for major operational surfaces: the console shell, navigation, new hire request, document review queue, and audit logs.

The lesson is pragmatic browser testing. Early workflow tests should verify that the user can reach important surfaces without becoming brittle replicas of implementation details.
