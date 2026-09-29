# Feature 39 - CSV Import For Workers

## Plan

### Goal

Add a backend CSV worker import preview/commit flow for bulk onboarding.

### Impacted Codebase Areas

- `apps/api/src/modules/workers/*`: add CSV import endpoint.
- `apps/api/src/common/csv.ts`: small CSV parser for learning use.
- `docs/features/39-csv-import-workers.md`: plan and build journal.

### Implementation Approach

1. Add minimal CSV parser for comma-separated headers.
2. Validate required worker import fields.
3. Support preview mode returning parsed rows and errors.
4. Support commit mode that creates hire requests.
5. Audit committed imports.

### Design Considerations

- Real imports need file uploads, background jobs, and robust CSV parsing.
- Preview before commit is the key enterprise workflow.
- This slice keeps input as raw CSV text to avoid multipart complexity.

## Build Journal

Added a small CSV parser and `PATCH /workers/imports/csv`. The endpoint supports preview mode with row errors and commit mode that creates hire requests from valid CSV rows.

The important design lesson is preview before commit. Bulk import workflows should help users catch data problems before creating records.
