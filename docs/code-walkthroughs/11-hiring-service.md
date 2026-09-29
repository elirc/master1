# 11 - Hiring Service

Source: `apps/api/src/modules/hiring/hiring.service.ts`

## Why This File Matters

This is one of the most important files in the codebase. It owns the workflow that turns a client's proposed hire into onboarding records. In business software, service classes like this are where you look for invariants: what must be true before the app allows a change?

## Line-By-Line Reading Notes

Lines 1-6 import dependencies. `BadRequestException` creates HTTP-friendly validation errors. `assertTransition` and `hireRequestTransitions` import domain workflow rules. `PrismaService` handles persistence, and `AuditService` records sensitive actions.

Lines 8-13 define the injectable service and constructor dependencies. This is Nest dependency injection: callers do not instantiate the service manually.

Lines 15-21 implement `list()`. It optionally filters by `organizationId`, orders newest first, and includes related worker and organization data. The empty object in `where` is intentional; with strict TypeScript, passing `undefined` as a property is different from omitting it.

Lines 23-65 implement `create()`. This is called when a client creates a draft hire request.

Lines 24-26 load the organization. `findUniqueOrThrow` means the request fails if the organization id is invalid.

Lines 28-30 enforce the first important invariant: only approved organizations can create hires. This prevents clients from using the hiring workflow before platform ops approves them.

Lines 32-34 load country configuration.

Lines 36-38 enforce currency rules. If the worker country is `GB`, the salary must use that country's configured default currency.

Lines 40-54 create the hire request in `DRAFT` status by default. Notice optional fields like department and manager are normalized to `null`, not left as `undefined`.

Lines 56-62 write an audit log. The action name `hire_request.created` is a stable event phrase that humans and systems can search later.

Line 64 returns the created record.

Lines 67-89 implement `submit()`. This is a controlled state transition from draft to submitted.

Line 68 reads the current record and names it `before`. This is a common audit pattern.

Line 69 calls the domain state machine. This prevents illegal jumps.

Lines 71-77 update status and timestamp.

Lines 79-86 audit the transition with both `before` and `after`.

Lines 91-167 implement `approveForWorker()`. This is the richest method in the file.

Line 92 loads the hire request before doing anything else.

Lines 94-96 enforce that only submitted or internally reviewed hires can be approved for worker onboarding. This method currently uses an inline check; a good future refactor would use the shared transition helper more consistently.

Lines 98-100 load country settings because the employment record needs the country employer cost rate.

Line 102 starts a database transaction. This is crucial. Worker creation, employment creation, hire status update, notification, and audit log should all succeed or all fail together.

Lines 103-115 create the worker and an empty worker profile. The nested `profile: { create: {} }` is Prisma's way to create a related one-to-one row at the same time.

Lines 117-131 create the employment record. The employment is `PREBOARDING` because the worker has not completed onboarding yet.

Lines 133-140 update the hire request to `WORKER_ONBOARDING` and attach approval time.

Lines 142-149 create a notification record. Later, a background job can send this as email.

Lines 151-161 write the audit log inside the same transaction. This is stronger than auditing afterward because the audit entry cannot be lost if the business transaction commits.

Line 163 returns a bundle of created/updated records.

## Codebase Connections

- The frontend `OperationsDashboard` calls `/hire-requests`, `/submit`, and `/approve`.
- `WorkersService.activate()` later completes the lifecycle that this service starts.
- `CountryProfile` rules are used here for currency and employer cost.
- `AuditLog`, `Notification`, `Worker`, and `EmploymentRecord` are all touched by this service.

## Senior-Level Questions

- Should `approveForWorker()` be idempotent if called twice?
- Should notification creation be handled by a domain event helper?
- Should all status changes use the same transition helper?
- What tenant checks are missing before a user can act on an organization?
