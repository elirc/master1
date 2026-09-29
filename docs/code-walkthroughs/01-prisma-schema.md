# 01 - Prisma Schema

Source: `packages/database/prisma/schema.prisma`

## Why This File Matters

This is the backbone of the application. When you enter a business-heavy codebase, the database schema is often the fastest way to understand what the product really does. UI labels can be vague and services can hide complexity, but tables and relationships reveal the domain.

In GlobalWork, this file defines the core nouns of an Employer of Record platform: organizations, users, hire requests, workers, documents, employments, payroll cycles, invoices, notifications, audit logs, and internal notes.

## Line-By-Line Reading Notes

Lines 1-8 configure Prisma itself. The `generator client` block tells Prisma to generate a TypeScript client. The `datasource db` block says PostgreSQL is the backing database and the connection string comes from `DATABASE_URL`.

Lines 10-103 define enums. These are not just type niceties. They are business vocabulary. For example, `HireRequestStatus` gives the hiring workflow a controlled set of states. `PayrollCycleStatus` gives payroll a controlled lifecycle. A senior habit is to notice where status fields exist and then ask, "Where are transitions enforced?"

Lines 105-118 define `User`. This model supports both platform users and client users. `platformRole` is optional because a normal client user should not automatically be an internal admin. The relation fields at the bottom show that users can belong to organizations, act in audit logs, review documents, own internal notes, and receive notifications.

Lines 120-138 define `Organization`. This is the tenant boundary for the app. Almost every business record eventually points back to an organization. When learning a multi-tenant system, always identify the tenant key early. Here that key is usually `organizationId`.

Lines 140-151 define `OrganizationMember`. This is the join model between users and organizations. The `@@unique([organizationId, userId])` rule prevents the same user from being added twice to the same organization. The `role` field models client-side roles such as owner, finance, manager, and worker.

Lines 153-166 define `CountryProfile`. This is where country-specific configuration lives. The interesting fields are `requiredWorkerDocuments`, `requiredContractFields`, `annualPtoDays`, and `employerCostRateBps`. This keeps early country logic data-driven instead of scattering `if country === "GB"` checks everywhere.

Lines 168-196 define `HireRequest`. This is the pre-employment workflow object. It captures the proposed worker, job, country, salary, manager, and status. The optional `workerId` exists because a hire request does not become a worker immediately. The `@@index([organizationId, status])` index supports operational queues like "show pending hires for this client."

Lines 198-216 define `Worker`. Once a hire is approved for onboarding, the worker record is created. Notice the one-to-one link back to `HireRequest` through `hireRequestId`. The worker also owns profile, document, employment, payroll item, and note relationships.

Lines 218-232 define `WorkerProfile`. This stores onboarding profile details separately from the worker identity. The `completedAt` timestamp is important because activation checks can ask "has the worker completed their profile?" without guessing from individual nullable fields.

Lines 234-260 define `Document` and `DocumentReview`. A document has metadata and status; a review records who approved or rejected it and why. This separation is important. The current status is quick to query, while the review table preserves a review history.

Lines 262-280 define `EmploymentRecord`. This is the formal employment relationship. It contains salary, country, job title, status, and employer cost rate. The salary is stored as integer minor units, not floating point. That is deliberate because money should not be stored as imprecise decimals.

Lines 282-314 define payroll cycles and payroll items. `PayrollCycle` represents a period, country, and organization. `PayrollItem` represents line-level payroll data such as base pay and employer cost. The unique constraint on organization, country, and period prevents duplicate cycles for the same payroll window.

Lines 316-343 define invoices and invoice line items. An invoice is linked one-to-one with a payroll cycle through `payrollCycleId @unique`. That design says the first version generates one invoice per payroll cycle.

Lines 345-358 define `Notification`. This is intentionally simple: subject, body, status, optional user, optional organization. It is enough to support in-app notification records and background email delivery later.

Lines 360-376 define `AuditLog`. This is a cross-cutting compliance table. It stores the actor, action, entity, before/after snapshots, metadata, and timestamp. When you see a sensitive workflow, look for audit log creation nearby.

Lines 378-390 define `InternalNote`. This is an operations-console feature: internal staff can leave notes on organizations, hires, or workers. The nullable foreign keys make the note attachable to different kinds of records.

## Codebase Connections

- `HiringService` writes `HireRequest`, `Worker`, `WorkerProfile`, `EmploymentRecord`, `Notification`, and `AuditLog`.
- `WorkersService` reads `CountryProfile`, `Document`, and `WorkerProfile` before activating a worker.
- `PayrollService` reads active `EmploymentRecord` rows and creates `PayrollCycle` plus `PayrollItem` rows.
- `InvoicesService` reads `PayrollItem` rows and creates `Invoice` plus `InvoiceLineItem` rows.
- `DocumentsService` writes `Document`, `DocumentReview`, and `AuditLog`.

## Senior-Level Questions

- Which queries need tenant filtering by `organizationId`?
- Which status fields need explicit transition rules?
- Which fields contain sensitive data and should be audited?
- Which indexes will matter once the tables grow?
- Which nullable fields represent "not known yet" versus "not applicable"?
