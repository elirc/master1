# Feature 43 - Background Job Retry Policies

## Plan

### Goal

Centralize queue retry/backoff settings and apply them consistently to notification/outbox jobs.

### Impacted Codebase Areas

- `apps/api/src/modules/outbox/queue-policy.ts`: shared queue policy.
- `apps/api/src/modules/notifications/notifications.service.ts`: use policy.
- `apps/worker/src/index.ts`: use policy for downstream email jobs where practical.
- `docs/features/43-background-job-retry-policies.md`: plan and build journal.

### Implementation Approach

1. Add named retry policy object.
2. Use policy when queueing outbox events.
3. Use policy when outbox worker queues email jobs.
4. Document dead-letter limitations.
5. Leave advanced dead-letter queues for a future slice.

### Design Considerations

- Retry configuration should be intentional and visible.
- Backoff protects dependencies from retry storms.
- Different job types may need different policies later.

## Build Journal

Added named outbox/email retry policy objects and applied them to outbox enqueueing and downstream email enqueueing from the worker.

The important design lesson is intentional retries. Retry count and backoff are production behavior, not incidental queue options.
