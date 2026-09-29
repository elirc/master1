# Feature 29 - Outbox Retry Admin Tools

## Plan

### Goal

Add admin endpoints for inspecting failed outbox events and retrying them through the existing worker queue.

### Impacted Codebase Areas

- `apps/api/src/modules/outbox/*`: new admin module.
- `apps/api/src/app.module.ts`: register module.
- Existing `OutboxEvent` model and worker queue.
- `docs/features/29-outbox-retry-admin-tools.md`: plan and build journal.

### Implementation Approach

1. Add list endpoint with status filter.
2. Add retry endpoint that resets status and queues processing.
3. Guard endpoints to platform admins.
4. Preserve attempt/error history on the outbox row.
5. Use the same queue name the worker already consumes.

### Design Considerations

- Retry tools are operationally powerful and should be platform-admin only.
- Retrying should not create a new event; it should re-drive the durable event.
- A future version can add bulk retry and dead-letter classification.

## Build Journal

Added an `outbox-events` admin module with list and retry endpoints. Retrying resets a failed/pending event to `PENDING` and enqueues the existing outbox worker job with the shared retry policy.

The important design lesson is operational recovery. Durable events are only half the pattern; operators also need safe tools to inspect and re-drive failed work.
