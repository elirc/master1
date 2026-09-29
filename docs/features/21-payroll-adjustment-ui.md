# Feature 21 - Payroll Adjustment UI

## Plan

### Goal

Add frontend controls for creating, reviewing, and inspecting payroll adjustments.

### Impacted Codebase Areas

- `apps/web/app/ui/operations-dashboard.tsx`: add adjustment state, form, list, approve/reject actions.
- Existing payroll adjustments API from Feature 13.
- `apps/web/app/globals.css`: add form/table styling reuse.
- `docs/features/21-payroll-adjustment-ui.md`: plan and build journal.

### Implementation Approach

1. Load payroll adjustments for the demo tenant.
2. Add a compact form that selects worker, kind, amount, description, and optional payroll cycle.
3. Add approve/reject actions for submitted adjustments.
4. Refresh payroll cycles after approval because approved adjustments can create payroll items.
5. Hide the feature from users without finance/payroll roles.

### Design Considerations

- Adjustment UI teaches the difference between source records and generated payroll items.
- Amount entry should be human-friendly while backend storage remains minor units.
- This first UI can use demo tenant data rather than a full multi-tenant selector.

## Build Journal

Added payroll adjustment creation and review controls to the operations console. Finance-capable users can choose a worker, adjustment kind, amount, description, and optional payroll cycle, then approve or reject submitted adjustments.

The frontend calls the payroll-adjustments module, which still enforces editability rules and creates payroll items only on approval. The UI intentionally shows adjustments separately from payroll cycles so the source record remains visible.

The lesson is workflow layering. A clean UI does not remove the need for backend state rules; it gives users a practical way to move records through those rules.
