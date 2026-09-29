# Feature 45 - Admin Impersonation Mode

## Plan

### Goal

Allow platform admins to create audited impersonation sessions for support workflows.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add impersonation session model.
- `apps/api/src/modules/auth/*`: add impersonation endpoint.
- `docs/features/45-admin-impersonation-mode.md`: plan and build journal.

### Implementation Approach

1. Add `ImpersonationSession`.
2. Add platform-admin endpoint to impersonate a user.
3. Issue a token for the target user and record impersonator.
4. Include impersonation metadata in response.
5. Audit session creation.

### Design Considerations

- Impersonation is high-risk and must be explicit.
- The UI should show impersonation state later.
- Tokens should carry enough context for audit in a future version.

## Build Journal

Added impersonation sessions and a platform-admin `POST /auth/impersonate` endpoint. The endpoint records the impersonator, target user, reason, token id, audit log, and returns a short-lived token for the target user.

The important design lesson is explicit risk modeling. Impersonation is useful for support, but it must be visible and auditable from the beginning.
