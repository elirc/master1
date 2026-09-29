# Feature 12 - Payroll Locking Rules

## Plan

### Goal

Strengthen payroll lifecycle rules so payroll behaves more like a controlled financial workflow. Locked payroll should not be casually edited, and payroll should not advance without required data.

### Impacted Codebase Areas

- `packages/domain/src/states.ts`: add payroll editability helper.
- `packages/domain/src/states.test.ts`: add regression tests.
- `apps/api/src/modules/payroll/payroll.service.ts`: enforce item and lock checks during status advancement.
- `docs/features/12-payroll-locking-rules.md`: plan and build journal.

### Implementation Approach

1. Add `isPayrollCycleEditable()`.
2. Add tests for editable and non-editable statuses.
3. In `PayrollService.advance()`, load cycle items.
4. Block review/approval advancement for empty payroll cycles.
5. Add a reusable service-level guard for future payroll mutations.

### Design Considerations

- Payroll locking is not only a status. It is a contract that downstream features must respect.
- Adjustments, expenses, and time off all need to know whether payroll is editable.
- This slice prepares the codebase for payroll adjustments in the next feature.

## Build Journal

Added `isPayrollCycleEditable()` to the domain package and covered it with tests. Keeping this rule in `packages/domain/src/states.ts` makes it reusable by payroll and by future modules that need to know whether payroll can still receive changes.

`PayrollService.advance()` now loads cycle items and blocks advancement into review, approval, or lock states when the cycle has no payroll items. It also applies editability checks so finalized states cannot be casually mutated through status advancement.

The service now exposes `assertEditable(payrollCycleId)`, which gives future features one clear way to ask, "Can I attach something to this payroll cycle?" The payroll adjustments feature uses this immediately.

The key lesson is that financial workflow state is a boundary, not decoration. Once payroll is locked, processed, or closed, downstream code must treat it as protected. Putting that rule behind a named helper makes the constraint easier to find, test, and reuse.
