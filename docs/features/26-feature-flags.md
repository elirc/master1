# Feature 26 - Feature Flags

## Plan

### Goal

Add tenant-aware feature flags so new capabilities can be enabled gradually.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add feature flag model.
- `apps/api/src/modules/feature-flags/*`: new module, controller, service, DTOs.
- `apps/api/src/app.module.ts`: register feature flag module.
- `apps/web/app/ui/operations-dashboard.tsx`: display and toggle tenant flags for platform admins.
- `docs/features/26-feature-flags.md`: plan and build journal.

### Implementation Approach

1. Add a `FeatureFlag` model scoped globally or to an organization.
2. Add list/upsert endpoints guarded by platform admin role.
3. Add a lightweight service helper for checking whether a flag is enabled.
4. Add dashboard controls for demo tenant flags.
5. Audit flag changes.

### Design Considerations

- Flags are production operations tools, not just booleans in code.
- Tenant-scoped flags let teams roll out risky workflows gradually.
- Flag names should be stable strings that can be referenced safely by services and frontend code.

## Build Journal

Added a tenant-aware `FeatureFlag` model with a stable scope key, flag key, enabled state, description, and optional organization relation. The stable scope key avoids relying on nullable unique behavior for global flags.

Added a feature-flags module with list and upsert endpoints guarded by platform admin role. Flag changes are audited. The service also exposes `isEnabled()` for future modules to gate behavior.

The operations console now lets platform admins create and toggle demo-tenant flags.

The lesson is rollout control. Feature flags are operational architecture: they let teams ship code separately from enabling behavior for every tenant.
