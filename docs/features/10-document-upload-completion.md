# Feature 10 - Document Upload Completion Flow

## Plan

### Goal

Extend document upload intents into a fuller lifecycle: create upload intent, upload file to object storage, complete upload with metadata, and only then allow review.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add document upload metadata and pending-upload status.
- `apps/api/src/modules/documents/*`: add complete-upload DTO, endpoint, and service method.
- Existing document review logic: block review until upload has been completed.
- `docs/features/10-document-upload-completion.md`: plan and build journal.

### Implementation Approach

1. Add `PENDING_UPLOAD` to `DocumentStatus`.
2. Add file metadata fields to `Document`: file name, content type, size, checksum, uploaded timestamp.
3. Change upload-intent creation to create documents in `PENDING_UPLOAD`.
4. Add `PATCH /documents/:id/complete-upload`.
5. Store upload completion metadata and move status to `UPLOADED`.
6. Require status `UPLOADED` or `PENDING_REVIEW` before review.

### Design Considerations

- Presigned upload URL creation and upload completion are separate because the API does not directly receive file bytes.
- Completion metadata gives operations and future security scans something to inspect.
- A production system should verify object existence and checksum before trusting completion.

## Build Journal

Documents now have a clearer upload lifecycle. The Prisma `DocumentStatus` enum includes `PENDING_UPLOAD`, and the `Document` model records upload metadata: original file name, content type, byte size, checksum, and upload timestamp.

The upload-intent endpoint now creates a document record before bytes are uploaded. That document starts in `PENDING_UPLOAD`, which means the system knows a document is expected but does not yet trust that the file exists. The new `PATCH /documents/:id/complete-upload` endpoint records file metadata and moves the document to `UPLOADED`.

Review behavior was tightened so reviewers cannot approve or reject a document still waiting for upload completion. This keeps the workflow honest: intent creation, file transfer, completion, and review are separate steps.

The key lesson is that "upload" is rarely one operation in enterprise software. There is usually intent creation, object-storage transfer, metadata verification, virus scanning, human review, and audit. Modeling the intermediate state gives later features a place to attach without rewriting the whole document module.
