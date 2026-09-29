# Feature 30 - Worker Profile Edit Requests

## Plan

### Goal

Allow workers to request profile changes that require approval before changing official worker profile data.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add profile edit request model and status enum.
- `apps/api/src/modules/workers/*`: add request/review endpoints.
- `docs/features/30-worker-profile-edit-requests.md`: plan and build journal.

### Implementation Approach

1. Add profile edit request status enum.
2. Store proposed changes as JSON.
3. Add worker/request endpoint and reviewer/review endpoint.
4. On approval, apply proposed changes to `WorkerProfile`.
5. Audit request review.

### Design Considerations

- Worker-submitted data is not always immediately authoritative.
- Storing the proposed diff gives reviewers context and keeps history.
- This same pattern can be reused for bank/tax-sensitive changes.

## Build Journal

Added `WorkerProfileEditRequest`, request creation, request listing, and review endpoints. Approved requests apply proposed JSON changes into `WorkerProfile`; rejected requests require a decision reason.

The important design lesson is controlled mutation. Sensitive worker profile changes become reviewable records instead of direct overwrites.
