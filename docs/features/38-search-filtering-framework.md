# Feature 38 - Search And Filtering Framework

## Plan

### Goal

Add reusable search query parsing and apply it to worker and audit-style list endpoints.

### Impacted Codebase Areas

- `apps/api/src/common/search.ts`: shared search helper.
- `apps/api/src/modules/workers/*`: add search filtering.
- `apps/web/app/ui/operations-dashboard.tsx`: add worker search input.
- `docs/features/38-search-filtering-framework.md`: plan and build journal.

### Implementation Approach

1. Add helper to normalize search terms.
2. Apply worker search across name, email, and country.
3. Keep filters optional and backwards-compatible.
4. Add frontend worker search state.
5. Document pattern for future list endpoints.

### Design Considerations

- Search should be normalized before building Prisma filters.
- Each module still chooses fields that make sense for its domain.
- Later work can move to full-text search.

## Build Journal

Added `common/search.ts` and applied normalized search to the workers list endpoint across name, email, and country code. The operations console now includes a worker search control.

The important design lesson is standardization without over-abstraction. The helper normalizes terms, while each module still chooses domain-relevant fields.
