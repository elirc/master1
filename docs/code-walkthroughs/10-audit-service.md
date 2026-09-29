# 10 - Audit Service

Source: `apps/api/src/modules/prisma/services/audit.service.ts`

## Why This File Matters

Audit logging is a cross-cutting concern. Many domain modules need it, but each module should not invent its own audit insert shape. This service centralizes the common audit write.

## Line-By-Line Reading Notes

Lines 1-4 import Nest, Prisma types, request context, and `PrismaService`.

Lines 6-15 define `AuditInput`. This is the contract callers must satisfy when writing an audit log.

Line 7 carries the request context.

Lines 8-10 identify the action and entity.

Lines 11-13 allow optional `before`, `after`, and `metadata` JSON payloads.

Line 17 marks the class injectable.

Line 19 injects `PrismaService`.

Lines 21-38 define `log()`.

Lines 24-29 map the request context and audit fields into the Prisma create call. Notice `?? null`. Prisma distinguishes between omitted properties, `undefined`, and nullable fields. The database column is nullable, so `null` is explicit and type-safe.

Lines 30-32 store JSON values. When no value is provided, the service writes Prisma JSON null.

## Codebase Connections

- `OrganizationsService`, `HiringService`, `WorkersService`, `DocumentsService`, `PayrollService`, and `InvoicesService` use audit logging.
- Some services write audit rows directly inside a transaction instead of using this service, because the audit row must commit atomically with related database writes.

## Senior-Level Questions

- Should audit writes always be inside the same transaction as the business change?
- Should `before` and `after` store whole records or summarized diffs?
- Should audit logs be immutable by database policy?
