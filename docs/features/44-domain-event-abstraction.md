# Feature 44 - Domain Event Abstraction

## Plan

### Goal

Add a small domain event service so modules can record durable events without hand-crafting outbox records.

### Impacted Codebase Areas

- `apps/api/src/modules/events/*`: new domain event module/service.
- `packages/database/prisma/schema.prisma`: add domain event model.
- `apps/api/src/modules/notifications/notifications.service.ts`: use event helper where appropriate.
- `docs/features/44-domain-event-abstraction.md`: plan and build journal.

### Implementation Approach

1. Add `DomainEvent`.
2. Add event recording service.
3. Optionally pair event recording with outbox creation.
4. Use it for notification email events.
5. Keep event naming stable and string-based.

### Design Considerations

- Domain events are a history of things that happened.
- Outbox events are side effects to process.
- They are related but not the same record.

## Build Journal

Added `DomainEvent` and a domain-events service. Notification creation now records a `notification.created` domain event in addition to the outbox side effect.

The important design lesson is separating "what happened" from "what to do next." Domain events describe facts; outbox events drive side effects.
