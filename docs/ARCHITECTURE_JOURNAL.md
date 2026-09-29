# Architecture Journal

This journal is written for a junior developer who wants to grow into mid-level and senior-level engineering habits quickly. The goal is not only to explain what was built, but to explain why each piece exists, what tradeoffs it creates, and how to keep evolving the codebase without letting it become a pile of unrelated features.

## 2026-05-03 - Project Framing

We are building a fictional Employer of Record platform called GlobalWork. An EOR platform lets client companies hire workers in countries where the client may not have a local legal entity. That domain is useful for growth because it contains many real production concerns:

- Multi-tenant data access: one client must never see another client's workers, payroll, documents, or invoices.
- Workflow state: hires, documents, payroll cycles, expenses, and invoices all move through controlled states.
- Sensitive data: identity documents, compensation, tax details, and bank details require careful permissions and auditing.
- Operational queues: internal teams need dashboards for work that is pending, blocked, overdue, or risky.
- Background work: notifications, payroll cycle generation, invoice creation, document reminders, and email retries cannot all happen inline in HTTP requests.
- Country-specific rules: required onboarding fields, document types, payroll frequency, leave policy, and contract requirements vary by jurisdiction.

The project is intentionally a modular monolith. That means one deployable backend application, but code is organized into domain modules with explicit boundaries. This gives us the learning benefits of enterprise architecture without the accidental complexity of microservices.

## System Shape

The repository is a monorepo:

```txt
apps/
  api/      NestJS HTTP API
  web/      Next.js web application
  worker/   BullMQ background worker process
packages/
  config/   shared environment/config parsing
  database/ Prisma schema, migrations, seed data
  domain/   shared domain enums, state transitions, and policy helpers
```

The API is the source of truth for business workflows. The web app should not decide whether a worker can become active or whether payroll can be locked. The frontend can make the experience pleasant, but the backend owns invariants.

The database package owns the schema and seed data because database structure is shared by the API, worker, and tests. The domain package owns reusable workflow definitions so state transition rules are not rewritten differently in every module.

## How Components Connect

At a high level:

```txt
Next.js web app
  -> calls REST endpoints on NestJS API
     -> API modules validate input and enforce permissions
        -> services execute domain workflows
           -> Prisma writes PostgreSQL records
           -> audit log records sensitive changes
           -> notification records are created
           -> worker jobs are queued for async processing

BullMQ worker
  -> reads jobs from Redis
     -> sends or simulates email
     -> can generate recurring payroll cycles later
     -> records delivery status in PostgreSQL
```

This separation matters. A common junior-level mistake is putting everything in a controller or page component. Senior engineers tend to ask: "Where does this rule live, and how do I prevent it from being accidentally bypassed?" In this codebase, workflow rules live in backend services and shared domain helpers. Controllers are thin adapters from HTTP to application behavior.

## Initial Vertical Slice

The first build supports a realistic but incomplete EOR lifecycle:

1. A platform admin seeds supported countries and a demo client company.
2. A client creates and submits a hire request.
3. Internal operations approves the hire.
4. A worker onboarding record is created.
5. Documents can be uploaded/reviewed.
6. A worker can become active only when onboarding requirements are complete.
7. A payroll cycle can be created for a month.
8. Payroll items are generated for active employments.
9. An invoice is generated from approved payroll.
10. Audit logs and notifications capture important events.

This is deliberately "bigger than an MVP" but not full production. It creates enough surface area to add future features under realistic pressure.

## Boundary Rules

These are the architectural rules we should protect as the project grows:

- Tenant isolation must be enforced in backend queries. The frontend is never a security boundary.
- Workflow state transitions must be explicit. Avoid arbitrary string updates like `status = body.status`.
- Money should be stored in integer minor units, such as cents or pence, plus a currency code.
- Sensitive changes should create audit logs in the same transaction as the change whenever possible.
- External side effects, such as email, should happen through retryable background jobs.
- Country-specific rules should be data-driven first, then promoted to code only when they need complex behavior.
- Controllers should stay thin. Domain services should hold the business process.
- Tests should cover invariants and state transitions before visual polish.

## Why These Choices Matter

The fastest path from junior to mid-level is learning to make changes without breaking unrelated behavior. The fastest path from mid-level to senior-level is learning to design systems so other developers can make changes safely too.

This project is shaped to force those skills:

- Prisma schema design teaches data modeling and migration thinking.
- NestJS modules teach dependency boundaries and application layering.
- REST endpoints teach contract design and integration discipline.
- Background jobs teach asynchronous reliability and retries.
- Audit logs teach accountability and compliance-minded engineering.
- Playwright tests teach user workflow verification.
- Testcontainers teach confidence against real infrastructure instead of fragile mocks.

## Running Journal Notes

- Corepack could run pnpm, but could not create the global pnpm shim under `Program Files` in this environment. The repo still uses pnpm; local commands can be run as `corepack pnpm ...`.
- The first implementation favors explicit domain services over clever abstractions. This is intentional. Abstractions become valuable after repeated patterns are visible.
- The country profile is modeled as data in PostgreSQL. This keeps initial country expansion simple and makes the admin/config story realistic.
- The app is not using microservices yet. A modular monolith is easier to debug, test, and refactor while still teaching enterprise-scale design.

## 2026-05-03 - Initial Implementation Notes

The first implementation now has three runtime surfaces:

- `apps/api`: a NestJS API that owns business rules and persistence.
- `apps/web`: a Next.js operations console that calls the API.
- `apps/worker`: a BullMQ worker that processes async jobs.

The API has modules for countries, organizations, hiring, workers, documents, payroll, invoices, and notifications. These modules are intentionally plain. A senior habit is to let boundaries be visible before making abstractions clever.

The current hiring flow is:

```txt
Client creates hire request
  -> HiringService validates organization and country currency
  -> hire request is stored as DRAFT
  -> submit endpoint moves it to SUBMITTED
  -> approval creates Worker, WorkerProfile, and EmploymentRecord
  -> notification is created
  -> audit log records the transition
```

The current worker activation flow is:

```txt
Worker profile completed
  -> required country documents uploaded
  -> documents reviewed and approved
  -> WorkersService checks required documents from CountryProfile
  -> Worker and EmploymentRecord become ACTIVE in one transaction
```

The payroll flow is deliberately simplified but architecturally realistic:

```txt
Payroll cycle created for organization + country + period
  -> active employments are selected
  -> base pay item generated
  -> employer cost item generated from country employer cost rate
  -> payroll cycle moves through explicit statuses
  -> approved cycle can generate invoice
```

Notice the pattern: important state changes happen in services, not React components. React can trigger a state change, but the backend decides whether that change is legal.

### Current Simplifications

This is not production EOR software yet. Some important simplifications are intentional:

- Authentication is represented by headers and seeded demo users, not a real login flow.
- File upload stores a `storageKey`; actual S3/MinIO upload wiring is a future slice.
- Payroll uses simplified gross pay and employer cost estimates. Real taxes are out of scope for the initial build.
- Permissions are not fully enforced yet. The next serious backend slice should add guards and tenant-aware query helpers.
- Email jobs exist as worker infrastructure, but most API paths currently create notification records directly.

These simplifications are useful because they keep the first build coherent while leaving obvious senior-level expansion paths.

### Next Architecture Pressure Points

The next features should deliberately stress the codebase:

- Add real authentication and role-based authorization guards.
- Add tenant isolation tests for every organization-scoped module.
- Move notification creation behind a domain event helper that also enqueues BullMQ jobs.
- Add MinIO upload endpoints with document metadata validation.
- Add payroll adjustment records for expenses, unpaid leave, and bonuses.
- Add OpenAPI generation and a typed frontend API client.
- Add integration tests with Testcontainers so service behavior is verified against real PostgreSQL.

## 2026-05-03 - Testing Infrastructure Notes

Two testing hooks were added early even though the full test suite is intentionally still small:

- `apps/web/playwright.config.ts` defines browser-level smoke testing for the operations console.
- `packages/test-utils/src/postgres-test-database.ts` exposes a Testcontainers helper for future integration tests that need real PostgreSQL.

This is a senior-level habit: add the rails before the train gets heavy. The first test does not need to verify every workflow. Its job is to make the test runner real, prove the app can be opened by automation, and give future features an obvious place for workflow coverage.

The next high-value tests should cover:

- Tenant isolation in API list/detail endpoints.
- Hire request state transitions.
- Worker activation blocked by missing country-required documents.
- Payroll cycle creation from active employments.
- Invoice generation blocked until payroll approval.

## 2026-05-04 - Codebase Walkthrough Notes

The project now includes a dedicated code-reading curriculum under `docs/code-walkthroughs/`. These files explain the top slice of human-authored source files in a line-by-line or line-range style.

The purpose is not to duplicate the source code. The purpose is to teach codebase navigation:

- Start with the schema to learn the domain nouns.
- Read domain helpers to learn workflow and money invariants.
- Read API bootstrap/module files to learn application composition.
- Read services to learn business rules and transaction boundaries.
- Read the frontend dashboard to learn how user actions trigger backend workflows.
- Read the worker and test helpers to understand async and integration-test surfaces.

This is an intentional learning scaffold. As the codebase grows, every major feature should add or update a walkthrough for the files that carry the most architectural weight.

## 2026-05-04 - Living Software Feature Expansion

Seven new feature slices were added with plan-first documentation under `docs/features/`:

- Authentication and RBAC
- Tenant isolation tests
- MinIO/S3 document upload intents
- Time off workflow
- Expenses workflow
- Notification queue integration
- OpenAPI contract and generated frontend client

Before those features, `docs/SYSTEM_DESIGN_FORWARD_PLAN.md` was added to set architectural direction. This matters because real living software is not only a list of tickets. It is a set of future pressures: security, tenant isolation, async work, contracts, auditability, payroll side effects, and extension points.

The most important pattern from this round is plan -> implement -> journal. That rhythm builds the habit of thinking before changing, then reflecting after changing. Senior engineers do this constantly, even when the artifact is not always a formal document.

## 2026-05-04 - Second Living Software Expansion

Ten additional feature slices were added with the same plan-first, journal-after process:

- Real frontend login/session flow
- PostgreSQL-backed tenant isolation integration tests
- Document upload completion and metadata
- Organization invitations and member role management
- Payroll locking/editability rules
- Payroll adjustments with approval and payroll item creation
- Invoice HTML/PDF artifact generation
- Tenant-aware audit log viewer API
- Worker outbox pattern for durable side effects
- GitHub Actions CI pipeline

This round pushed the codebase toward more realistic enterprise pressure. The main architectural theme is separating source records from derived effects:

- An invitation is the source record; membership is created when it is accepted.
- A payroll adjustment is the source record; a payroll item is created when approved.
- An invoice is the financial record; the generated HTML/PDF is an artifact derived from it.
- A notification is the user-facing record; an outbox event is the durable side-effect record.

That distinction is senior-level modeling. It makes the system easier to audit, retry, explain, and extend.

Verification for this round included Prisma generation, OpenAPI type generation, monorepo typecheck, tests, and production build.

## 2026-05-04 - Third Living Software Expansion

Ten more feature slices were added:

- Frontend role-management UI
- Document review dashboard
- Audit-log frontend viewer
- Payroll adjustment UI
- Object-storage verification boundary
- API pagination helpers
- Playwright workflow tests
- Worker self-service portal
- Tenant-scoped feature flags
- Observability basics

This round is about operating the system, not only modeling it. A real SaaS codebase needs surfaces for admins, operators, workers, reviewers, and platform engineers. It also needs the boring rails: pagination, logs, request IDs, health checks, browser tests, and feature flags.

The most important architectural pattern from this round is "backend authority, frontend usability." The frontend now exposes richer workflows, but services still own tenant boundaries, status transitions, audit logs, and security checks.

Verification included Prisma generation, monorepo typecheck, unit tests, production build, and Playwright Chromium workflow tests.

## 2026-05-04 - Fourth Living Software Expansion

Twenty additional feature slices were added to round out the current backlog:

- Notification preferences
- Outbox retry admin tools
- Worker profile edit requests
- Employment contract generation
- Country compliance rules
- Time-off balances
- Expense reimbursement into payroll
- Invoice payments and reconciliation
- Billing account settings
- Organization settings UI
- Search and filtering helpers
- CSV worker import
- CSV report export
- Database migration discipline
- API e2e tests
- Background job retry policies
- Domain event abstraction
- Admin impersonation
- Client approval workflows
- SLA task queue

The architectural theme is operational maturity. The codebase now has more of the boring-but-real structures that appear in company software: admin recovery tools, audit-friendly source records, import/export workflows, settings, approvals, support impersonation, migration checks, and internal tasks.

Verification included Prisma validation, Prisma generation, monorepo typecheck, unit tests, API e2e tests, production build, and Playwright Chromium workflow tests.
