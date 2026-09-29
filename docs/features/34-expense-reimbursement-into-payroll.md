# Feature 34 - Expense Reimbursement Into Payroll

## Plan

### Goal

Allow approved expenses to be attached to an editable payroll cycle as reimbursement payroll items.

### Impacted Codebase Areas

- `apps/api/src/modules/expenses/*`: add attach-to-payroll behavior.
- `apps/api/src/modules/payroll/payroll.service.ts`: reuse editability guard.
- Existing payroll item model.
- `docs/features/34-expense-reimbursement-into-payroll.md`: plan and build journal.

### Implementation Approach

1. Add DTO for payroll cycle attachment.
2. Add endpoint `PATCH /expenses/:id/attach-payroll`.
3. Require expense to be approved for payroll.
4. Require payroll cycle to be editable.
5. Create `EXPENSE_REIMBURSEMENT` payroll item and link expense to the cycle.

### Design Considerations

- Expense approval and payroll inclusion are separate actions.
- Payroll item creation should happen transactionally with expense linking.
- Locked payroll must reject new reimbursements.

## Build Journal

Added `PATCH /expenses/:id/attach-payroll`. Approved expenses can now be linked to editable payroll cycles and create `EXPENSE_REIMBURSEMENT` payroll items in the same transaction.

The important design lesson is separation of approvals from inclusion. An expense can be approved before it is included in a specific payroll run.
