# Feature 15 - Audit Log Viewer

## Plan

### Goal

Expose audit logs through a filtered API so internal users and authorized organization users can inspect sensitive changes.

### Impacted Codebase Areas

- `apps/api/src/modules/audit/*`: new audit module, controller, and service.
- `apps/api/src/app.module.ts`: register audit module.
- `docs/features/15-audit-log-viewer.md`: plan and build journal.

### Implementation Approach

1. Add `AuditModule`.
2. Add `GET /audit-logs`.
3. Support filters by organization, entity type, entity id, actor, and action.
4. Allow platform admins to query all logs.
5. Require organization scope for non-platform users.

### Design Considerations

- Audit logs are security-sensitive. The viewer must respect tenant boundaries.
- This first version is API-only. A frontend table can be added later.
- Returning actor details helps human investigation.

## Build Journal

Added an `AuditModule` with controller and service, then registered it in `AppModule`. The new `GET /audit-logs` endpoint supports filters for organization, entity type, entity id, actor, and action.

The service enforces tenant scope before querying. Platform admins can query across organizations. Organization users can query logs for organizations they belong to, and when they do not provide an explicit organization id the query is automatically scoped to their memberships.

During verification, TypeScript's `exactOptionalPropertyTypes` caught an important API-shape issue: the controller was passing keys with explicit `undefined` values. The fix was to build the filter object only from present query parameters. That makes the controller's contract cleaner and avoids accidental ambiguity.

The key lesson is that read endpoints need authorization design too. Audit logs can reveal sensitive operational data, so a viewer endpoint must be tenant-aware even though it is "only reading."
