# Feature 36 - Billing Account Settings

## Plan

### Goal

Add structured organization billing settings for tax IDs, billing contacts, payment terms, purchase order requirements, and invoice currency preferences.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add billing account model.
- `apps/api/src/modules/organizations/*`: add billing settings endpoints.
- `docs/features/36-billing-account-settings.md`: plan and build journal.

### Implementation Approach

1. Add `BillingAccount` one-to-one with organization.
2. Add get/upsert endpoint.
3. Keep existing organization billing email/currency for compatibility.
4. Audit billing setting changes.
5. Prepare frontend organization settings to edit this record.

### Design Considerations

- Billing settings often grow beyond simple organization columns.
- A separate model avoids overloading the organization table.
- Payment terms and PO requirements affect invoice workflows later.

## Build Journal

Added `BillingAccount` and organization billing get/upsert endpoints. Billing settings now include contact details, tax ID, payment terms, invoice currency, and purchase-order requirements.

The important design lesson is model growth. Billing starts as a few organization columns, but it quickly earns its own table as requirements expand.
