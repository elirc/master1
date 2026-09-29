# Feature 13 - Payroll Adjustments

## Plan

### Goal

Add manual payroll adjustments such as bonuses, allowances, commissions, and deductions, with review and payroll-cycle inclusion.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add adjustment status/type/model.
- `apps/api/src/modules/payroll-adjustments/*`: new module, controller, service, and DTOs.
- `apps/api/src/modules/payroll/payroll.service.ts`: reuse editability guard for adjustment inclusion.
- `apps/api/src/app.module.ts`: register adjustment module.
- `docs/features/13-payroll-adjustments.md`: plan and build journal.

### Implementation Approach

1. Add payroll adjustment enums and model.
2. Add create/list/review endpoints.
3. On approval, if a payroll cycle is supplied, verify the cycle is editable.
4. Create a payroll item from approved adjustment data.
5. Audit adjustment creation and review.

### Design Considerations

- Adjustments are separate from payroll items because they need their own approval workflow.
- Payroll items are the calculated/included result; adjustments are the request/source record.
- Locked payroll cycles cannot receive new adjustment items.

## Build Journal

Added payroll adjustment enums and a `PayrollAdjustment` model to Prisma. Adjustments are connected to organization, worker, optional payroll cycle, and optional reviewer. This separates the request/review record from the payroll item that may eventually be included in payroll.

Created a new `payroll-adjustments` API module with DTOs, controller, and service. The controller exposes list, create, and review operations behind platform payroll roles. The service validates worker ownership, normalizes deductions to negative amounts, checks payroll-cycle editability, and writes audit logs.

Approving an adjustment can create a `PayrollItem` on the chosen cycle. That keeps payroll totals based on payroll items while preserving the adjustment as the source record explaining why the item exists.

The module imports `PayrollModule` so it can reuse `PayrollService.assertEditable()`. This is a small but important modular-monolith pattern: features can cooperate through explicit service APIs instead of duplicating business rules.

The key lesson is source-of-truth modeling. The adjustment is the business event; the payroll item is the calculated inclusion in a pay run. Mature systems often keep both because operations teams need traceability.
