# Feature 05 - Expenses Workflow

## Plan

### Goal

Add worker expense submission, review, and payroll reimbursement inclusion.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add expense enums and model.
- `packages/domain/src/states.ts`: add expense transition rules.
- `apps/api/src/modules/expenses/*`: new module, controller, service, and DTOs.
- `apps/api/src/app.module.ts`: register expenses module.
- `apps/api/src/modules/payroll/payroll.service.ts`: include approved expenses as reimbursement payroll items.
- `docs/features/05-expenses-workflow.md`: plan and build journal.

### Implementation Approach

1. Add `ExpenseCategory` and `ExpenseStatus` enums.
2. Add `Expense` model linked to organization, worker, and optionally payroll cycle.
3. Add endpoints for listing, submitting, reviewing, and marking reimbursed.
4. Audit all expense state changes.
5. During payroll cycle creation, create `EXPENSE_REIMBURSEMENT` payroll items for approved expenses not already assigned to a payroll cycle.

### Design Considerations

- Expenses are money records, so amounts stay in integer minor units plus currency.
- Payroll should only consume expenses approved for payroll.
- The initial version stores receipt storage keys, assuming file upload can be handled through the storage/document pattern.
- A later version should add policy limits, duplicate detection, OCR, multi-currency conversion, and manager approval stages.

## Build Journal

Implemented:

- Added `ExpenseCategory` and `ExpenseStatus` database enums.
- Added `Expense` model linked to organization, worker, and optionally payroll cycle.
- Added expense state transitions in the domain package.
- Added `ExpensesModule`, controller, service, create DTO, and review DTO.
- Added endpoints for listing, submitting, reviewing, and marking expenses reimbursed.
- Added audit logs for submitted, reviewed, and reimbursed expenses.
- Updated payroll generation to create `EXPENSE_REIMBURSEMENT` payroll items for approved expenses not already attached to a payroll cycle.

Verification:

- Ran `corepack pnpm db:generate`.
- Ran `corepack pnpm typecheck`.
- Ran `corepack pnpm --filter @globalwork/domain test`.

Lessons learned:

- Expenses look like a simple CRUD feature at first, but they quickly touch approval workflow, money, file references, payroll, and audit logging.
- Adding `payrollCycleId` to expenses creates traceability from reimbursement back to the payroll cycle that included it.
- The next maturity step is receipt upload intents, policy limits, duplicate detection, manager approval stages, and multi-currency handling.
