# Feature 35 - Invoice Payments And Reconciliation

## Plan

### Goal

Track invoice payments, partial payments, references, and reconciliation notes.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add invoice payment model.
- `apps/api/src/modules/invoices/*`: add payment endpoint and status recalculation.
- `docs/features/35-invoice-payments-reconciliation.md`: plan and build journal.

### Implementation Approach

1. Add `InvoicePayment`.
2. Add payment recording DTO and endpoint.
3. Sum payments to decide `PARTIALLY_PAID` versus `PAID`.
4. Store reference and notes.
5. Audit payment recording.

### Design Considerations

- Payments are source records; invoice status is derived from them.
- Partial payment support makes reconciliation more realistic.
- Overpayments should be blocked in this first version.

## Build Journal

Added `InvoicePayment` and `POST /invoices/:id/payments`. Payments record amount, currency, reference, notes, and received date, then recalculate invoice status as partial or paid.

The important design lesson is source records versus derived status. Payments explain the money movement; invoice status summarizes it.
