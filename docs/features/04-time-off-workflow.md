# Feature 04 - Time Off Workflow

## Plan

### Goal

Add worker time off requests with approval/rejection and payroll impact for unpaid leave.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add time off enums and model.
- `packages/domain/src/states.ts`: add time off transition rules.
- `apps/api/src/modules/time-off/*`: new module, controller, service, and DTOs.
- `apps/api/src/app.module.ts`: register the time off module.
- `apps/api/src/modules/payroll/payroll.service.ts`: include approved unpaid leave deductions.
- `docs/features/04-time-off-workflow.md`: plan and build journal.

### Implementation Approach

1. Add `TimeOffType` and `TimeOffStatus` enums.
2. Add `TimeOffRequest` model linked to organization and worker.
3. Add create/list/review endpoints.
4. Audit create and review actions.
5. Add domain transition rules for approval and rejection.
6. During payroll cycle creation, add deduction items for approved unpaid leave overlapping the payroll period.

### Design Considerations

- Time off is organization-scoped and worker-scoped.
- Leave approval is a state machine, not a free-form status update.
- Payroll should consume approved records; it should not decide approval itself.
- This version uses simplified day counting and salary/day deduction logic. Country-specific leave rules can evolve later.

## Build Journal

Implemented:

- Added `TimeOffType` and `TimeOffStatus` database enums.
- Added `TimeOffRequest` model linked to organization and worker.
- Added domain state transitions for time off review.
- Added `TimeOffModule`, controller, service, create DTO, and review DTO.
- Added endpoints for listing, creating, and reviewing time off requests.
- Added audit logs for requested and reviewed leave.
- Updated payroll generation to create negative deduction payroll items for approved unpaid leave overlapping the payroll period.

Verification:

- Ran `corepack pnpm db:generate`.
- Ran `corepack pnpm typecheck`.
- Ran `corepack pnpm --filter @globalwork/domain test`.

Lessons learned:

- New business workflows usually touch database schema, domain state, API services, authorization, audit, and downstream consumers.
- Payroll should consume approved time off records, not own the leave approval decision.
- Even a simplified unpaid-leave deduction creates useful architecture pressure around dates, overlap logic, and money calculations.
- Future improvements should add PTO balances, accrual, manager permissions, country-specific leave policy, and integration tests around payroll deductions.
