# Feature 27 - Observability Basics

## Plan

### Goal

Add request IDs, structured request logging, richer health output, and worker heartbeat reporting.

### Impacted Codebase Areas

- `apps/api/src/common/*`: request-id middleware and logging interceptor.
- `apps/api/src/main.ts`: register middleware/interceptor.
- `apps/api/src/modules/health/*`: expand health response.
- `apps/worker/src/index.ts`: update worker heartbeat file/log.
- `docs/features/27-observability-basics.md`: plan and build journal.

### Implementation Approach

1. Add request id middleware that reads or creates `x-request-id`.
2. Add a logging interceptor for method, URL, status, duration, and request id.
3. Expand health response with app, timestamp, and dependency placeholders.
4. Have the worker write/log a heartbeat during startup and shutdown.
5. Keep this implementation dependency-light.

### Design Considerations

- Observability should start before the system is large.
- Request IDs make frontend/API/worker debugging much easier.
- This first slice is intentionally simple; metrics and tracing can come later.

## Build Journal

Added request-id middleware that reads or creates `x-request-id` and returns it on every response. Added a global request logging interceptor that logs method, path, status, duration, and request id as structured JSON.

Expanded the health endpoint with uptime and dependency configuration signals for database, Redis, and object storage. The worker now writes a heartbeat JSON file under `tmp/worker-heartbeat.json` and logs heartbeat events during startup and shutdown.

The lesson is debuggability. Request IDs, structured logs, health output, and worker heartbeat signals are small investments that make production incidents much easier to follow.
