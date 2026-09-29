# Feature 33 - Time-Off Balance Accruals

## Plan

### Goal

Track annual time-off allowance, used days, and remaining balance per worker/year/type.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add time-off balance model.
- `apps/api/src/modules/time-off/*`: add balance endpoint and update balances on approval.
- `docs/features/33-time-off-balance-accruals.md`: plan and build journal.

### Implementation Approach

1. Add `TimeOffBalance`.
2. Initialize or upsert balances from country annual PTO defaults.
3. When vacation time off is approved, increment used days.
4. Add balance list endpoint.
5. Block approval if balance would go negative.

### Design Considerations

- Balances are derived operational records but need persistence for audit and performance.
- Real accrual rules vary by country; this first version is annual allowance based.
- Decimal days require care because partial-day leave is common.

## Build Journal

Added `TimeOffBalance` and worker balance endpoints. Vacation approval now ensures an annual balance exists, blocks overuse, and increments used days transactionally.

The important design lesson is derived state with guardrails. Balances are derived from policy and requests, but persisting them makes review and reporting practical.
