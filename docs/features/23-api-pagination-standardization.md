# Feature 23 - API Pagination Standardization

## Plan

### Goal

Introduce reusable pagination helpers and apply them to high-traffic list endpoints.

### Impacted Codebase Areas

- `apps/api/src/common/pagination.ts`: shared query parsing and response helpers.
- List controllers/services for workers, documents, audit logs, and payroll adjustments.
- Frontend API consumers where paged responses are used.
- `docs/features/23-api-pagination-standardization.md`: plan and build journal.

### Implementation Approach

1. Add helpers for page, page size, skip/take, and response metadata.
2. Use helpers in new review/audit/adjustment endpoints first.
3. Keep backwards compatibility where the dashboard already expects arrays.
4. Document the pagination pattern for future endpoint migrations.
5. Add tests for pagination math.

### Design Considerations

- Standard pagination avoids every module inventing slightly different query behavior.
- Backwards compatibility matters in living software; endpoint shape changes should be deliberate.
- Count queries add cost, so they should be used intentionally.

## Build Journal

Added `apps/api/src/common/pagination.ts` with `parsePagination()` and `pagedResponse()`. The helper normalizes invalid input, caps page size, calculates skip/take, and wraps rows with consistent metadata.

Applied the pattern to document review queue, payroll adjustments, and audit logs. These are good first targets because they are operational list endpoints that can grow quickly.

Added unit tests in `pagination.spec.ts`. The tests cover invalid input, capped page size, offset math, and response metadata.

The lesson is consistency. A shared pagination contract prevents every module from inventing its own slightly different list behavior.
