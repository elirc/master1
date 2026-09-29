# Feature 46 - Client Approval Workflows

## Plan

### Goal

Add configurable client approval workflow definitions and approval step records.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add approval workflow and step models.
- `apps/api/src/modules/approvals/*`: new module.
- `docs/features/46-client-approval-workflows.md`: plan and build journal.

### Implementation Approach

1. Add workflow definitions by organization/entity type.
2. Add approval step records for entity approvals.
3. Add endpoints to configure workflows and approve steps.
4. Audit workflow changes and step decisions.
5. Keep integration with expenses/payroll for future slices.

### Design Considerations

- Configurable approvals are a platform capability.
- Approval workflow data should be separate from the business record.
- Future modules can ask approvals whether an action is complete.

## Build Journal

Added approval workflow and approval step models, plus endpoints to create workflows, create entity-specific steps, and review steps.

The important design lesson is decoupling approvals from business records. Expenses, payroll, hires, and other entities can later share the same approval infrastructure.
