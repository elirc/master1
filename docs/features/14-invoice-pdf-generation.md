# Feature 14 - Invoice PDF Generation

## Plan

### Goal

Add invoice artifact generation so invoices can produce a PDF-like HTML document, record a storage key, and be regenerated only while allowed.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add invoice PDF artifact metadata.
- `apps/api/src/modules/invoices/*`: add generate-PDF endpoint and service method.
- `docs/features/14-invoice-pdf-generation.md`: plan and build journal.

### Implementation Approach

1. Add `pdfStorageKey` and `pdfGeneratedAt` to `Invoice`.
2. Add `PATCH /invoices/:id/generate-pdf`.
3. Render a simple invoice HTML document from invoice and line items.
4. Store a deterministic storage key on the invoice.
5. Block PDF generation for voided invoices.

### Design Considerations

- This version records the generated artifact metadata and returns HTML. A production version would upload a rendered PDF to S3/MinIO.
- Draft invoices can be regenerated; issued invoices can also generate the final artifact.
- The storage key is stable enough for future object storage integration.

## Build Journal

Invoices now store artifact metadata: `pdfStorageKey` and `pdfGeneratedAt`. The API exposes `PATCH /invoices/:id/generate-pdf` for finance/platform users.

The invoice service loads the invoice with its organization and line items, blocks generation for voided invoices, renders a simple HTML invoice document, and records a deterministic storage key such as `invoices/{organizationId}/{invoiceNumber}.html`.

This first version returns HTML rather than writing to object storage. That keeps the feature useful and testable while preserving a future integration point for real PDF rendering and S3/MinIO upload.

The key lesson is to split artifact generation from invoice state. An invoice can be a financial record, while the generated PDF/HTML is an artifact derived from that record. Storing artifact metadata lets users know whether a shareable document exists and when it was generated.
