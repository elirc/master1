# Feature 16 - Worker Outbox Pattern

## Plan

### Goal

Introduce an outbox table so domain code can record intended side effects durably before worker processing. This reduces the risk of losing side effects when a database write succeeds but queue enqueueing fails.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add outbox event model and statuses.
- `apps/api/src/modules/notifications/notifications.service.ts`: create outbox events and enqueue outbox processing jobs.
- `apps/worker/src/index.ts`: process outbox events and enqueue email jobs.
- `docs/features/16-worker-outbox-pattern.md`: plan and build journal.

### Implementation Approach

1. Add `OutboxEvent` model with type, payload, status, attempts, errors, and processed timestamp.
2. Change notification queuing to create notification and outbox event in one database transaction.
3. Enqueue an `outbox` job by outbox event id.
4. Worker processes outbox event and enqueues the existing email job.
5. Worker marks outbox event processed or failed.

### Design Considerations

- Full outbox polling can be added later; this first version still nudges processing with a queue job.
- The database event is the durable record.
- The outbox payload should remain small and reference durable ids.

## Build Journal

Added an `OutboxEvent` model with status, type, JSON payload, attempt count, error text, and processed timestamp. This gives the database a durable record of intended side effects.

Notification creation now happens in a database transaction that creates both the `Notification` and a related `OutboxEvent`. After the transaction commits, the API nudges BullMQ by enqueueing an `outbox` job containing the outbox event id.

The worker now has two queues. The new outbox worker loads an event, marks it processing, interprets the event type, and for `notification.email` enqueues the existing email job. It then marks the outbox event processed. Failures are recorded on the outbox row and rethrown so BullMQ retry behavior still applies.

This is not a full polling outbox yet, but it introduces the core reliability pattern: the database record is the source of truth, and the queue job is a delivery mechanism.

The key lesson is to watch for dual-write problems. "Save to database, then enqueue job" can lose side effects if the process crashes between those steps. The outbox pattern gives the system something durable to recover from.
