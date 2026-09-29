# Feature 18 - Frontend Role Management UI

## Plan

### Goal

Add an operations-console UI for organization members and invitations so role management becomes visible and usable from the frontend.

### Impacted Codebase Areas

- `apps/web/app/ui/operations-dashboard.tsx`: add members/invites state, loading, forms, and actions.
- `apps/web/app/globals.css`: add compact admin table/form styling.
- Existing organizations API endpoints from Feature 11.
- `docs/features/18-frontend-role-management-ui.md`: plan and build journal.

### Implementation Approach

1. Load organization members for the demo tenant.
2. Add an invite form with email and role fields.
3. Add member role update controls.
4. Add invitation revoke controls where possible.
5. Keep UI access role-aware while relying on API guards for enforcement.

### Design Considerations

- This is an internal console workflow, so dense tables and compact forms are more appropriate than marketing-style cards.
- The frontend should make the security model legible: who belongs to the tenant and what role they hold.
- Later work can add copyable invite links and email delivery.

## Build Journal

Built the role-management workflow directly into the operations console. The dashboard now loads members and invitations for the demo organization, renders an invite form, lets authorized users change member roles, and revokes pending invitations.

This feature reuses the organization endpoints added earlier rather than creating a separate frontend-only data model. That is the key connection: React owns interaction state and form submission, while the organizations module owns membership rules, invite lifecycle, and audit logging.

The lesson is that admin UI work is not "just screens." It is a security-sensitive operational surface. The frontend makes the role model visible, but the API remains the authority.
