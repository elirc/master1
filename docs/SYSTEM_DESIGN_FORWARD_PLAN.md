# System Design Forward Plan

This document describes the direction for GlobalWork as it grows from a starter modular monolith into a living EOR SaaS codebase. It exists before the next feature work so each feature can be built with a shared architectural target instead of becoming an isolated patch.

## Architectural Goal

GlobalWork should remain a modular monolith for now. The backend is one NestJS deployable, but domain modules should stay cleanly separated:

- Identity and access owns users, authentication, roles, and authorization helpers.
- Organizations owns tenant/company records and membership.
- Hiring owns hire requests and the transition into onboarding.
- Workers owns worker profile and employment activation rules.
- Documents owns document metadata, upload intent, review, and storage keys.
- Payroll owns payroll cycles, line items, and status transitions.
- Time off owns leave requests, balances, and payroll-impacting absences.
- Expenses owns reimbursement requests, approval, and payroll inclusion.
- Invoicing owns invoice generation and payment lifecycle.
- Notifications owns notification records and async delivery.
- Audit owns durable history of sensitive changes.

The key principle: feature modules may coordinate through explicit services and durable database records, but they should not duplicate each other's business rules.

## Cross-Cutting Design Rules

### Tenant Isolation

Every organization-scoped table should be queried through an organization boundary. The current project uses `organizationId` as the tenant key. New endpoints should either:

- derive tenant scope from authenticated request context, or
- explicitly require organization id and verify the actor is allowed to access it.

Frontend filtering is never a security boundary.

### Authorization

Authentication answers "who are you?" Authorization answers "what are you allowed to do?" GlobalWork should make this explicit with:

- request context populated by auth middleware or guards,
- role and permission helpers,
- controller/service checks before sensitive actions,
- tests that prove denied access fails.

### State Machines

Workflow status fields should move through explicit transitions. Payroll and hiring already use state-machine helpers. Time off, expenses, documents, invoices, and employment lifecycle should follow the same pattern.

### Money

Money should stay in integer minor units with a currency code. Multi-currency calculations must reject accidental addition until an explicit FX conversion feature exists.

### Files

The database stores document metadata and storage keys. File bytes belong in object storage such as MinIO/S3. API code should create upload intents or accept storage keys; it should not let UI code invent untracked file references without metadata.

### Notifications

Domain modules should create notification records through a shared notification service. The notification service should enqueue retryable jobs. Workers should process side effects and update delivery status.

### Testing

The project should grow from unit tests into integration and E2E tests:

- domain tests for pure business rules,
- service integration tests with Testcontainers and PostgreSQL,
- API permission and tenant isolation tests,
- Playwright tests for critical workflows.

### Frontend Contracts

The frontend should stop hand-writing API response shapes as the API grows. OpenAPI generation should produce a contract artifact that the frontend can consume. Even if the first generated client is lightweight, the habit matters.

## Roadmap Impact Of The Next Seven Features

1. Real authentication and role-based authorization will create the identity boundary that all future features depend on.
2. Tenant isolation tests will make security expectations executable.
3. File upload with MinIO/S3 will create a realistic document storage boundary.
4. Time off workflow will introduce a new approval workflow and future payroll deductions.
5. Expenses workflow will introduce another approval workflow and future payroll reimbursement inputs.
6. Notification queue integration will move side effects out of domain services.
7. OpenAPI-generated frontend client will reduce frontend/backend contract drift.

## Future-Proofing Choices

- Keep services explicit and boring until repeated patterns justify abstraction.
- Prefer small shared helpers for authorization, tenant scope, state transitions, notifications, and money.
- Add database columns that preserve auditability and lifecycle state, even when the first UI is simple.
- Put feature docs next to architecture docs so learning and implementation stay coupled.
- When adding a new module, include controller, service, DTOs, schema model, audit behavior, and at least basic tests or test hooks.

## Current Known Gaps

- Authentication is still intentionally lightweight and header-based until the auth feature lands.
- Some modules still accept `organizationId` as a query parameter. Tenant isolation work should narrow that.
- Document upload currently stores metadata only. Storage integration should add upload intents and object keys.
- Payroll currently does not include time off or expenses. Those modules should create approved records that payroll can include later.
