# Feature 40 - CSV Export Reports

## Plan

### Goal

Add CSV export endpoints for workers, invoices, and audit logs.

### Impacted Codebase Areas

- `apps/api/src/common/csv.ts`: CSV serialization helper.
- `apps/api/src/modules/reports/*`: new report module.
- `apps/api/src/app.module.ts`: register module.
- `docs/features/40-csv-export-reports.md`: plan and build journal.

### Implementation Approach

1. Add CSV serializer.
2. Add report endpoints returning text/csv responses.
3. Scope exports by organization id.
4. Guard exports by platform or organization roles.
5. Keep result sets intentionally capped for this first version.

### Design Considerations

- CSV exports are operationally useful but can leak data.
- Authorization and tenant scoping matter as much for exports as API JSON.
- Later exports should move to background jobs for large datasets.

## Build Journal

Added CSV serialization and a reports module with workers, invoices, and audit export endpoints. Exports are organization-scoped and capped for this first implementation.

The important design lesson is that exports are data access features. They need tenant scope and role guards just like JSON APIs.
