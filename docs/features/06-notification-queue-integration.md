# Feature 06 - Notification Queue Integration

## Plan

### Goal

Move notifications closer to real async behavior by having the API create notification records and enqueue email jobs for the worker process.

### Impacted Codebase Areas

- `apps/api/package.json`: add BullMQ/Redis client dependencies for queue producers.
- `apps/api/src/modules/notifications/notifications.service.ts`: add notification creation and job enqueueing.
- `apps/api/src/modules/notifications/notifications.module.ts`: export notification service.
- Domain services: replace direct notification inserts in selected workflows with notification service calls.
- `apps/worker/src/index.ts`: already consumes `email` jobs, so this feature connects the producer side.
- `docs/features/06-notification-queue-integration.md`: plan and build journal.

### Implementation Approach

1. Add a BullMQ `Queue` producer to `NotificationsService`.
2. Add `createAndQueue()` to create the notification row and enqueue an `email` job with `notificationId`.
3. Add retry/backoff options to queued jobs.
4. Update hiring approval and invoice issue flows to use queued notifications.
5. Keep direct notification listing unchanged.

### Design Considerations

- The database notification record is the durable source of truth.
- Queue jobs are side effects and should be retryable.
- Ideally notification creation and queue enqueueing would use an outbox pattern. This version is simpler but creates the right module boundary.
- Worker delivery marks notifications as sent.

## Build Journal

Implemented:

- Added BullMQ and ioredis as direct API dependencies.
- Updated `NotificationsService` to own an `email` queue producer.
- Added `createAndQueue()` to create notification records and enqueue retryable jobs.
- Exported `NotificationsService` from `NotificationsModule`.
- Updated hiring approval to create queued onboarding notifications.
- Updated invoice issue flow to create queued invoice notifications.
- Kept the worker-side consumer unchanged because it already processes `email` jobs by `notificationId`.

Verification:

- Ran `corepack pnpm install`.
- Ran `corepack pnpm typecheck`.

Lessons learned:

- Async work needs both durable records and queue jobs. The notification row is the durable product record; the queue job is the retryable side effect.
- The current implementation is useful but not perfect: a production-grade version should use an outbox pattern so database commits and job enqueueing cannot get out of sync.
- Queues create a new runtime dependency, so local development now depends more heavily on Redis being available.
