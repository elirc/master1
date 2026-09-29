# 13 - Documents Service

Source: `apps/api/src/modules/documents/documents.service.ts`

## Why This File Matters

Documents are a sensitive part of EOR software. This service models upload metadata, review, rejection reasons, and audit logging. It also demonstrates the difference between storing a file and storing metadata about a file.

## Line-By-Line Reading Notes

Lines 1-6 import Nest, context, audit, Prisma, and DTOs.

Lines 8-13 define the injectable service and dependencies.

Lines 15-36 implement `create()`.

Line 16 loads the worker. This verifies the worker exists and gives the service access to `organizationId` for auditing.

Lines 17-26 create a `Document` record. The actual file bytes are not uploaded here yet. `storageKey` points to where the file would live in MinIO or S3.

Line 23 uses a conditional spread for `expiresAt`. This is a TypeScript strictness pattern: do not pass `expiresAt: undefined`; omit it entirely when absent.

Lines 28-34 write a `document.uploaded` audit log.

Line 36 returns the document metadata.

Lines 38-88 implement `review()`.

Lines 39-41 enforce that rejected documents need a reason. This is a product-quality and compliance-quality detail.

Lines 43-46 load the document and worker. The worker relation provides organization context for audit logging.

Lines 47-52 resolve the reviewer id. In a real auth system this should come from the authenticated actor. In the current local demo, it falls back to a seeded platform admin.

Lines 54-56 reject the review if no reviewer exists.

Line 58 starts a transaction.

Lines 59-62 update the document's current status.

Lines 64-71 create a `DocumentReview` history record. The current document status tells you where the document is now; the review row tells you how it got there.

Lines 73-85 write an audit log in the same transaction.

Line 87 returns both the document and review.

## Codebase Connections

- `OperationsDashboard.uploadRequiredDocs()` calls document create and review endpoints.
- `WorkersService.activate()` requires approved documents before activation.
- The Prisma schema separates `Document` and `DocumentReview`.

## Senior-Level Questions

- Should one worker be allowed multiple documents of the same type?
- How should expired documents affect activation or continued employment?
- Should document review require a platform role?
- Should actual file upload be pre-signed through MinIO/S3?
