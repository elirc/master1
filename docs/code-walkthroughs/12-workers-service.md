# 12 - Workers Service

Source: `apps/api/src/modules/workers/workers.service.ts`

## Why This File Matters

This service owns the transition from "onboarding worker" to "active employee." That transition is sensitive because activating a worker affects payroll, invoicing, documents, and compliance.

## Line-By-Line Reading Notes

Lines 1-5 import Nest exceptions, request context, audit, Prisma, and the profile DTO.

Lines 7-12 define the injectable service and dependencies.

Lines 14-26 implement `list()`. It optionally filters workers by organization and includes profile, documents, employment, and hire request. This kind of include-heavy query is common in operational consoles where one screen needs summary context.

Lines 28-42 implement `completeProfile()`. It uses `upsert`, which means create the profile if it does not exist or update it if it does. The method sets `completedAt` every time, which marks the profile as done.

Lines 44-111 implement `activate()`.

Lines 45-52 load the worker plus profile, documents, employment, and hire request. The activation decision needs all of that context.

Lines 54-56 block activation when the profile is incomplete.

Lines 58-60 block activation if the employment record does not exist. That should normally be created by `HiringService.approveForWorker()`.

Lines 62-64 load country configuration.

Line 65 casts `requiredWorkerDocuments` from JSON to string array. Prisma JSON fields lose some specific TypeScript shape, so the service reasserts what it expects.

Lines 66-68 build a set of approved document types. A set is a good fit because the code needs fast "does this type exist?" checks.

Line 69 computes missing required documents by comparing country requirements with approved uploads.

Lines 71-73 reject activation if any documents are missing. This is one of the most important compliance-style invariants in the current app.

Line 75 starts a transaction.

Lines 76-79 update the worker to `ACTIVE`.

Lines 81-84 update the employment record to `ACTIVE`.

Lines 86-89 update the original hire request to `ACTIVE`.

Lines 91-103 write the audit log inside the transaction.

Line 105 returns all three updated records.

## Codebase Connections

- `HiringService.approveForWorker()` creates the worker and employment records that this service activates.
- `DocumentsService.review()` creates the approved documents required here.
- `PayrollService.create()` only selects active employment records, so activation controls payroll inclusion.

## Senior-Level Questions

- Should worker, employment, and hire status always be synchronized?
- Should activation be blocked by unsigned contracts specifically?
- Should activation emit a notification or domain event?
- Should the JSON cast for required documents be replaced with stricter validation at the database boundary?
