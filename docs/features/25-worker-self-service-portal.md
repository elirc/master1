# Feature 25 - Worker Self-Service Portal

## Plan

### Goal

Add a worker-facing portal surface for viewing onboarding status, profile completion, documents, time off, and expenses.

### Impacted Codebase Areas

- `apps/api/src/modules/workers/*`: add current-worker portal endpoint where needed.
- `apps/web/app/worker/*`: new worker portal route and UI.
- `apps/web/app/lib/session.ts`: reuse role/session helpers.
- `apps/web/app/globals.css`: portal layout styling.
- `docs/features/25-worker-self-service-portal.md`: plan and build journal.

### Implementation Approach

1. Add `GET /workers/self/portal` for authenticated worker users.
2. Return worker profile, documents, time off, and expenses.
3. Add `/worker` frontend route.
4. Redirect unauthenticated users to login.
5. Keep the portal read-mostly for this first slice.

### Design Considerations

- Worker users need a different mental model than internal operations users.
- The portal should be simple and status-focused.
- Later features can add direct document upload, time-off request, and expense submission from this route.

## Build Journal

Added `GET /workers/self/portal`, which resolves the authenticated user to a worker record and returns organization, onboarding, profile, documents, time off, and expenses. If the user is not connected to a worker, the API returns a forbidden error.

Added a new `/worker` frontend route with a simple self-service portal. It shows worker status, onboarding metrics, document statuses, time-off records, and expense records.

The lesson is audience separation. Internal operations users and workers need different navigation, language, and data density even though they share the same backend domain.
