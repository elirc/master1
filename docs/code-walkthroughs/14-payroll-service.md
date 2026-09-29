# 14 - Payroll Service

Source: `apps/api/src/modules/payroll/payroll.service.ts`

## Why This File Matters

Payroll is where business correctness starts to feel real. Even in this simplified version, the service must find active employments, generate line items, enforce cycle state transitions, and audit changes.

## Line-By-Line Reading Notes

Lines 1-6 import Nest exceptions, domain transition helpers, context, audit, Prisma, and the create DTO.

Lines 8-13 define the injectable service and dependencies.

Lines 15-25 implement `list()`. It optionally filters by organization, orders newest payroll cycles first, and includes payroll items plus invoice.

Lines 27-104 implement `create()`.

Lines 28-36 find active employment records for the given organization and country. This is why worker activation matters: inactive employments are not pulled into payroll.

Lines 38-40 reject cycle creation if there are no active employments. That keeps the demo workflow clear and avoids empty cycles.

Line 42 starts a transaction.

Lines 43-51 create the payroll cycle.

Lines 53-78 loop through active employments and create payroll items.

Lines 54-65 create base pay items. The amount comes from `employment.salaryAmountMinor`.

Lines 67-78 create estimated employer cost items. The formula uses basis points: `salary * bps / 10000`.

Lines 80-94 write the audit log inside the transaction. The audit payload records the period and employment count.

Lines 96-101 re-read the cycle with included items so callers get a useful response.

Lines 106-122 implement `advance()`.

Line 107 loads the existing cycle.

Line 108 uses the shared payroll state machine to reject illegal transitions.

Lines 110-114 update the cycle status and include related records.

Lines 116-123 audit the status change through `AuditService`.

## Codebase Connections

- `WorkersService.activate()` creates the active employments selected here.
- `InvoicesService.createFromPayroll()` requires approved or later payroll cycles.
- `OperationsDashboard` advances payroll through each status.

## Senior-Level Questions

- Should cycle creation be idempotent for the same period?
- Should salary be prorated by start date or unpaid leave?
- Should payroll items be regenerated or locked once created?
- Should payroll cycle transitions enforce permissions by role?
