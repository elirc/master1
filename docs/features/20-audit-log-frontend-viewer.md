# Feature 20 - Audit Log Frontend Viewer

## Plan

### Goal

Expose the audit-log API in the frontend so sensitive changes can be inspected without leaving the operations console.

### Impacted Codebase Areas

- `apps/web/app/ui/operations-dashboard.tsx`: add audit log state, filters, and table.
- `apps/web/app/globals.css`: style dense audit rows and filter controls.
- Existing `GET /audit-logs` endpoint from Feature 15.
- `docs/features/20-audit-log-frontend-viewer.md`: plan and build journal.

### Implementation Approach

1. Load recent audit logs for the demo organization.
2. Add filters for entity type and action.
3. Display actor, action, entity, timestamp, and metadata summary.
4. Refresh audit logs after actions that write audit events.
5. Keep rendering resilient for optional actor and organization values.

### Design Considerations

- Audit logs often contain sparse or historical data, so the UI must tolerate missing relations.
- A small JSON summary is useful for learning, but production systems often need a safer redaction strategy.
- Audit visibility reinforces how backend actions connect to traceability.

## Build Journal

Added an audit-log panel to the operations console. It loads the tenant-scoped audit API, supports a simple action filter, and displays action, entity, actor, and timestamp in a dense table.

The audit API was upgraded to use the shared pagination helper, so the UI receives `data` and `meta` rather than an unbounded array. That makes the endpoint safer as audit volume grows.

The lesson is traceability. Every sensitive workflow becomes easier to understand when the product has a first-class way to inspect what changed, who changed it, and when.
