# Codebase Structure And System Design

This document is a guided map of the GlobalWork EOR platform codebase. Its purpose is to help a developer learn how the system is organized, how the major pieces connect, and what design tradeoffs were made while building it as a modular monolith.

## Repository Shape

The project is a TypeScript monorepo managed with pnpm workspaces and Turbo.

```text
apps/
  api/       NestJS backend API
  web/       Next.js frontend
  worker/    BullMQ background worker

packages/
  config/    shared environment configuration loader
  contracts/ OpenAPI contract and generated API client helpers
  database/  Prisma schema, Prisma client generation, seed data
  domain/    pure domain helpers and state-machine rules
  test-utils/ shared Testcontainers helpers

docs/
  features/          plan and journal docs for each feature slice
  code-walkthroughs/ file-by-file learning walkthroughs
  *.md               architecture, migration, and system design notes
```

The monorepo is intentionally structured like a real company codebase:

- Apps are deployable processes.
- Packages are shared libraries.
- Docs preserve decision history.
- Tests live close to the code they verify.

## Runtime Processes

### API Process

The API is a NestJS application in `apps/api`. `main.ts` creates the Nest app, sets the `/api` global prefix, enables CORS, applies Helmet, registers request ID middleware, and enables validation pipes.

`AppModule` is the composition root. It imports all feature modules:

- Auth and RBAC
- Organizations and billing
- Hiring
- Workers
- Documents and storage
- Compliance
- Contracts
- Expenses
- Time off
- Payroll and payroll adjustments
- Invoices and payments
- Notifications
- Outbox
- Domain events
- Audit logs
- Feature flags
- Reports
- Approvals
- Tasks
- Health

Most API modules follow the same shape:

```text
module/
  module.ts       Nest module registration
  controller.ts   HTTP routes and guards
  service.ts      business logic and database writes
  dto/*.ts        request validation contracts
```

This pattern is valuable because it gives every feature a predictable home.

### Web Process

The frontend is a Next.js app in `apps/web`.

The main routes are:

- `/login`: client-side login form and demo account shortcuts.
- `/`: internal operations console.
- `/worker`: worker self-service portal.

The operations console is currently concentrated in `apps/web/app/ui/operations-dashboard.tsx`. It loads many backend resources in one dashboard-level refresh function, then renders workflow panels for hiring, workers, members, documents, payroll, invoices, audit logs, feature flags, and billing settings.

The frontend talks to the API through `apps/web/app/lib/api.ts`, which wraps the generated contracts client and injects the stored bearer token. Browser session storage lives in `apps/web/app/lib/session.ts`.

### Worker Process

The worker is in `apps/worker/src/index.ts`. It connects to Redis through BullMQ and processes:

- `outbox` jobs, which read durable outbox events from Postgres and enqueue downstream work.
- `email` jobs, which mark notification records as sent after simulating email delivery.

The worker also writes a heartbeat file to `tmp/worker-heartbeat.json`, which gives a simple observability signal for local development.

## Shared Packages

### `packages/database`

This package owns the Prisma schema and seed script. The schema is the best single place to learn the domain nouns.

The central models are:

- `User`, `Organization`, `OrganizationMember`, `Invitation`
- `HireRequest`, `Worker`, `WorkerProfile`, `EmploymentRecord`
- `Document`, `DocumentReview`
- `PayrollCycle`, `PayrollItem`, `PayrollAdjustment`
- `Invoice`, `InvoiceLineItem`, `InvoicePayment`
- `TimeOffRequest`, `TimeOffBalance`
- `Expense`
- `Notification`, `NotificationPreference`
- `OutboxEvent`, `DomainEvent`
- `AuditLog`
- `FeatureFlag`
- `BillingAccount`
- `ComplianceRule`
- `EmploymentContract`
- `ImpersonationSession`
- `ApprovalWorkflow`, `ApprovalStep`
- `Task`

The schema is intentionally large because the project is meant to feel like a living enterprise codebase. Many models represent source records, while others represent derived artifacts or operational controls.

### `packages/domain`

The domain package contains pure TypeScript helpers that do not depend on Nest, Prisma, HTTP, or React.

Important files:

- `states.ts`: workflow transition maps and status guards.
- `money.ts`: money helpers.
- `country-profile.ts`: seed country compliance/payroll defaults.
- `*.test.ts`: pure unit tests.

The domain package is the right home for rules that should be shared and easy to test, such as whether a payroll cycle is editable.

### `packages/config`

This package loads environment variables and returns typed configuration for API/worker processes. It prevents each app from inventing its own env parsing.

### `packages/contracts`

This package contains the OpenAPI file and generated TypeScript schema/client pieces. The frontend uses the contract client wrapper instead of hand-rolling every request.

The contract is not yet exhaustive for every endpoint, which is a known growth area.

### `packages/test-utils`

This package exposes Testcontainers helpers for integration tests, especially PostgreSQL-backed tests.

## API Module Map

### Auth

Files:

- `auth.controller.ts`
- `auth.service.ts`
- `auth.guard.ts`
- `roles.guard.ts`
- `tenant-scope.ts`
- `token.ts`
- `password.ts`

Responsibilities:

- Register and log in users.
- Issue and verify HMAC-signed auth tokens.
- Build authenticated principals with platform roles and organization memberships.
- Enforce platform and organization role guards.
- Support platform-admin impersonation.
- Provide tenant-scope helpers for queries.

Connections:

- Uses `User` and `OrganizationMember`.
- Guards are used throughout controllers.
- Tenant-scope helpers are used by audit and organization-scoped behavior.

### Organizations

Responsibilities:

- Create/approve organizations.
- Manage members and invitations.
- Manage billing account settings.

Connections:

- `Invitation` creates future membership.
- `OrganizationMember` powers organization RBAC.
- `BillingAccount` extends organization billing data.
- Writes audit logs for security-sensitive actions.

### Hiring

Responsibilities:

- Create hire requests.
- Submit and approve hiring workflows.
- On approval, create worker and employment records.

Connections:

- Converts `HireRequest` into `Worker` plus `EmploymentRecord`.
- Uses country profile data for employer cost rates.
- Feeds worker onboarding, payroll, and contract generation.

### Workers

Responsibilities:

- List/search workers.
- Complete worker profiles.
- Activate workers after profile and documents are ready.
- Provide worker self-service portal data.
- Accept worker profile edit requests and review them.
- Import workers from CSV into hire requests.

Connections:

- Worker activation checks `WorkerProfile`, `Document`, `CountryProfile`, and `EmploymentRecord`.
- Worker portal aggregates worker profile, documents, time off, expenses, and organization.
- Profile edit requests protect sensitive profile changes.

### Documents And Storage

Responsibilities:

- Create document records.
- Create upload intents.
- Complete upload with metadata.
- Verify storage object keys.
- Review documents.
- Provide document review queue.

Connections:

- `StorageService` creates S3/MinIO-style upload intents and verifies object existence.
- `DocumentReview` records reviewer decisions.
- Worker activation depends on approved required documents.

### Compliance

Responsibilities:

- Manage country compliance rules.
- Evaluate workers against rule findings.

Connections:

- Uses `ComplianceRule`.
- Reads worker profile and document state.
- Complements hardcoded activation checks with data-driven findings.

### Contracts

Responsibilities:

- Generate employment contract HTML artifacts.
- Store contract metadata.

Connections:

- Reads `Worker`, `Organization`, and `EmploymentRecord`.
- Writes `EmploymentContract`.
- Audits generated contracts.

### Time Off

Responsibilities:

- Create and review time-off requests.
- Track annual vacation balances.
- Prevent approval when vacation balance would go negative.

Connections:

- Uses `TimeOffRequest` as the request/source record.
- Uses `TimeOffBalance` as the annual balance snapshot.
- Uses country annual PTO defaults to initialize balances.

### Expenses

Responsibilities:

- Create and review expenses.
- Mark expenses reimbursed.
- Attach approved expenses to editable payroll cycles.

Connections:

- Expense approval is separate from payroll inclusion.
- Attaching to payroll creates an `EXPENSE_REIMBURSEMENT` payroll item.
- Uses `PayrollService.assertEditable()` to protect locked payroll.

### Payroll

Responsibilities:

- Create payroll cycles.
- Generate payroll items from active employment.
- Advance payroll through lifecycle statuses.
- Guard locked/finalized payroll from mutation.
- Generate invoices from approved payroll.

Connections:

- Reads active `EmploymentRecord`s.
- Creates `PayrollItem`s.
- Payroll adjustments and expenses can add additional payroll items.
- Invoices derive from payroll cycle items.

### Payroll Adjustments

Responsibilities:

- Create manual payroll adjustments.
- Review adjustments.
- On approval, create payroll items.

Connections:

- `PayrollAdjustment` is the source/review record.
- `PayrollItem` is the effect on payroll.
- Uses payroll editability rules.

### Invoices

Responsibilities:

- Generate invoices from payroll.
- Issue invoices.
- Generate HTML/PDF-like invoice artifacts.
- Record partial/full payments.
- Recalculate invoice payment status.

Connections:

- `Invoice` derives from `PayrollCycle`.
- `InvoiceLineItem` derives from payroll items plus service fee.
- `InvoicePayment` records money movement.
- Notifications are queued when invoices are issued.

### Notifications, Domain Events, And Outbox

Responsibilities:

- Create notification records.
- Respect user notification preferences.
- Record domain events.
- Create outbox events for durable side effects.
- Provide admin retry tools for failed outbox events.

Connections:

- `Notification` is the user-facing message record.
- `NotificationPreference` controls user email opt-out.
- `DomainEvent` records the fact that something happened.
- `OutboxEvent` records side effects to process.
- Worker consumes outbox events and enqueues email jobs.

### Audit

Responsibilities:

- List audit logs with filters and pagination.
- Enforce tenant scope.

Connections:

- Many services write `AuditLog` records directly or through `AuditService`.
- The operations console exposes audit data to users.

### Feature Flags

Responsibilities:

- Store global or tenant-scoped flags.
- Allow platform admins to upsert flags.
- Provide `isEnabled()` helper for future gated behavior.

Connections:

- Feature flags are exposed in the operations console.
- Current flags are mostly operational records; deeper behavior gating can be added later.

### Reports

Responsibilities:

- Export workers, invoices, and audit logs as CSV.

Connections:

- Uses shared CSV serialization.
- Scopes exports by organization.

### Approvals

Responsibilities:

- Define approval workflows.
- Create approval steps for entity records.
- Review approval steps.

Connections:

- Approval workflows are generic and can point at multiple entity types.
- Future work can wire expenses, payroll, hires, and adjustments into this shared approval infrastructure.

### Tasks

Responsibilities:

- Create, list, and update operational tasks.
- Track assignee, priority, due date, status, and optional entity reference.

Connections:

- Tasks can point at arbitrary domain records through `entityType` and `entityId`.
- This is an internal operations layer rather than a domain-specific workflow.

## Key Workflows

### Hiring To Worker Activation

```text
HireRequest created
  -> HireRequest submitted
  -> HireRequest approved
  -> Worker created
  -> EmploymentRecord created
  -> Worker profile completed
  -> Required documents uploaded/reviewed
  -> Worker activated
  -> EmploymentRecord activated
```

This workflow shows the difference between request records and operational records. A hire request is not the worker yet. Approval turns it into worker/employment state.

### Document Upload And Review

```text
Upload intent requested
  -> Document created as PENDING_UPLOAD
  -> Storage upload happens outside API
  -> Complete upload records metadata
  -> Storage key is verified
  -> Document moves to UPLOADED
  -> Reviewer approves/rejects
  -> Worker activation checks approved required document types
```

The API does not directly receive file bytes. It coordinates metadata and storage intent.

### Payroll To Invoice To Payment

```text
PayrollCycle created
  -> Base pay/employer cost PayrollItems generated
  -> Adjustments/expenses can add PayrollItems
  -> Payroll status advances through review/approval/lock
  -> Invoice generated from approved payroll
  -> Invoice issued
  -> Notification queued
  -> Payment records added
  -> Invoice status becomes PARTIALLY_PAID or PAID
```

This workflow has several source/effect pairs:

- Payroll adjustment source -> payroll item effect.
- Expense source -> payroll reimbursement item effect.
- Invoice payment source -> invoice status effect.

### Notification Delivery

```text
Service requests notification
  -> Notification preference checked
  -> Notification row created
  -> DomainEvent recorded
  -> OutboxEvent created
  -> BullMQ outbox job enqueued
  -> Worker processes outbox event
  -> Email job enqueued
  -> Worker marks notification SENT
```

The outbox pattern reduces the chance of losing side effects after database writes.

### Audit And Operations Visibility

Most sensitive service actions write audit logs. The audit viewer reads those logs with tenant-aware filters. This creates a human-readable trail for changes like:

- Organization approval
- Invitation lifecycle
- Role changes
- Document review
- Payroll adjustment review
- Invoice payment recording
- Billing setting changes
- Task updates
- Impersonation start

## Frontend Structure

### Login Flow

`/login` renders `LoginForm`. It posts to `/auth/login`, stores the returned token/user in local storage, and redirects to `/`.

Session helpers live in `app/lib/session.ts`. The dashboard validates the stored token by calling `/auth/me`.

### Operations Console

The operations console is a dense internal tool. It loads data from many modules:

- Organizations
- Countries
- Hire requests
- Workers
- Payroll cycles
- Invoices
- Notifications
- Members/invitations
- Document queue
- Payroll adjustments
- Audit logs
- Feature flags
- Billing account

This gives the project one place to exercise many backend workflows from a single screen.

### Worker Portal

`/worker` is a separate worker-facing surface. It uses `/workers/self/portal` to show status, profile completion, documents, time off, and expenses.

This route exists to teach audience separation: internal operations users and workers should not share the same UI mental model.

## Testing And Verification

The project currently has several verification layers:

- Pure domain unit tests in `packages/domain`.
- API unit tests for tenant scope, pagination, CSV, and search helpers.
- API e2e test for the health endpoint and request ID middleware.
- Opt-in Testcontainers integration test for tenant isolation.
- Playwright browser tests for login and dashboard shell.
- Prisma validation script.
- CI workflow for install, generate, validate, typecheck, test, and build.

This is not full coverage yet, but it is a realistic skeleton. It gives future features obvious places to add stronger tests.

## Overall System Design Notes

### Main Design

The system is a modular monolith. That means it deploys as one API process, but the code is split into feature modules with clear responsibilities.

This is a good fit for the project because:

- It keeps local development simple.
- It avoids premature distributed-system complexity.
- It still teaches boundaries, transactions, module composition, and cross-feature workflows.
- It can later be split into services if a specific boundary truly needs independence.

### Important Modeling Pattern

The strongest pattern in the codebase is separating source records from derived effects:

- `HireRequest` -> `Worker` and `EmploymentRecord`
- `PayrollAdjustment` -> `PayrollItem`
- `Expense` -> reimbursement `PayrollItem`
- `PayrollCycle` -> `Invoice`
- `InvoicePayment` -> invoice payment status
- `Notification` -> outbox/email work
- `EmploymentRecord` -> generated `EmploymentContract`
- `ApprovalWorkflow` -> entity-specific `ApprovalStep`

This pattern makes systems easier to audit and debug. You can answer both "what is the current state?" and "what caused this state?"

### Tradeoffs Made

Several choices were made to keep the codebase learnable:

- The operations console is large and centralized instead of deeply componentized.
- The OpenAPI contract does not yet cover every endpoint.
- Several modules use direct Prisma calls rather than repository abstractions.
- Some workflows are API-first with minimal frontend support.
- The storage verification has a local/mock mode rather than always requiring real S3/MinIO.
- The outbox implementation is queue-nudged, not a full polling relay.
- Domain events exist, but only a few actions record them so far.
- Approval workflows are generic but not yet deeply integrated into every business workflow.
- CSV import accepts raw CSV text rather than multipart file upload.
- Auth uses local storage and custom HMAC tokens for learning simplicity.

These are acceptable learning-stage tradeoffs, but they are exactly where a production hardening pass should focus.

## How The Design Could Be Improved

### Strengthen API Contracts

The OpenAPI contract should become the source of truth for all API endpoints. Once complete, the frontend can rely more heavily on generated types and less on local interface duplication.

### Split The Dashboard Into Feature Components

`OperationsDashboard` is useful as a learning cockpit, but it has grown large. A good next refactor would split it into:

- `HiringPanel`
- `WorkersPanel`
- `MembersPanel`
- `DocumentsPanel`
- `PayrollPanel`
- `InvoicesPanel`
- `AuditPanel`
- `FeatureFlagsPanel`
- `BillingSettingsPanel`

This would teach component ownership and make frontend changes safer.

### Introduce Application Services For Cross-Module Workflows

Some flows cross many modules, such as payroll-to-invoice-to-notification. Dedicated application services could coordinate these workflows instead of putting all orchestration inside a single feature service.

### Make Domain Events First-Class

Many audit-worthy actions could also record domain events. Over time, the system could move toward:

```text
business service
  -> writes source record
  -> records domain event
  -> records outbox event when side effects are needed
```

That would create a clearer event history and make future integrations easier.

### Improve Authorization Depth

The project has real guards, but some endpoints still rely on broad platform roles or simple organization context. A production system should add:

- Resource-level authorization checks.
- Worker self-access checks.
- More tenant-isolation integration tests.
- Impersonation context in audit logs.
- Permission matrices documented per endpoint.

### Move Large Exports And Imports To Background Jobs

CSV import/export is currently synchronous and capped. Production versions should use:

- File upload to object storage.
- Import preview records.
- Background processing.
- Row-level validation result storage.
- Downloadable export artifacts.

### Expand Workflow Tests

The test foundation exists, but the most valuable next tests would be:

- Hire approval creates worker/employment.
- Worker activation blocks missing documents.
- Expense attaches to editable payroll only.
- Payroll locking blocks adjustments.
- Invoice payments block overpayment.
- Notification preference prevents email queueing.
- Outbox retry requeues failed events.

### Harden Auth And Session Management

For a real product, local-storage auth should be replaced or hardened with:

- HttpOnly cookies or a stronger token storage strategy.
- Token refresh.
- Session revocation.
- MFA for platform admins.
- Explicit impersonation banners and stop-impersonating behavior.

### Add Database Migration Review

The migration guide and validation script are a start. A more mature setup should:

- Generate committed Prisma migrations.
- Review SQL in pull requests.
- Add migration drift checks in CI.
- Run migrations against disposable databases.
- Document backfill and rollback plans.

## Suggested Reading Path

For a developer learning the codebase, read in this order:

1. `packages/database/prisma/schema.prisma`
2. `packages/domain/src/states.ts`
3. `apps/api/src/app.module.ts`
4. `apps/api/src/modules/auth/*`
5. `apps/api/src/modules/hiring/hiring.service.ts`
6. `apps/api/src/modules/workers/workers.service.ts`
7. `apps/api/src/modules/payroll/payroll.service.ts`
8. `apps/api/src/modules/invoices/invoices.service.ts`
9. `apps/api/src/modules/notifications/notifications.service.ts`
10. `apps/worker/src/index.ts`
11. `apps/web/app/ui/operations-dashboard.tsx`
12. `docs/features/` in numerical order

That path moves from data model, to pure rules, to module composition, to core workflows, to async processing, to UI behavior, to decision history.
