# Feature 37 - Organization Settings UI

## Plan

### Goal

Add a frontend organization settings panel for editing billing account settings and viewing tenant configuration.

### Impacted Codebase Areas

- `apps/web/app/ui/operations-dashboard.tsx`: add settings panel and form.
- `apps/web/app/globals.css`: reuse compact form/table styles.
- Billing endpoints from Feature 36.
- `docs/features/37-organization-settings-ui.md`: plan and build journal.

### Implementation Approach

1. Load billing account data for demo tenant.
2. Add settings navigation entry.
3. Add billing settings form.
4. Save changes through organization billing endpoint.
5. Refresh settings after save.

### Design Considerations

- Settings screens should be dense and predictable.
- Billing settings should be visible to finance/admin users.
- This first version focuses on billing, leaving compliance defaults for later.

## Build Journal

Added a billing settings panel to the operations console. Finance/admin users can load and save billing account details, and the settings area also lists available CSV report endpoints.

The important design lesson is UI ownership. Settings screens should expose tenant configuration clearly while still relying on backend guards for authority.
