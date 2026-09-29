# Feature 22 - Object Storage Verification

## Plan

### Goal

Make document upload completion verify the expected object exists before marking the document as uploaded.

### Impacted Codebase Areas

- `apps/api/src/modules/storage/storage.service.ts`: add object-existence verification helper.
- `apps/api/src/modules/documents/documents.service.ts`: call storage verification during upload completion.
- `docs/features/22-object-storage-verification.md`: plan and build journal.

### Implementation Approach

1. Add a storage service method that verifies an object key is known/acceptable.
2. Inject `StorageService` into `DocumentsService`.
3. During complete-upload, check the document storage key before changing status.
4. Return a clear error if storage verification fails.
5. Keep the first implementation compatible with local/mock storage.

### Design Considerations

- In production, this would be an S3/MinIO `HEAD` request.
- In this learning project, a deterministic local verification boundary is still valuable because it keeps the service shape realistic.
- The document service should not know object-storage implementation details.

## Build Journal

Added `StorageService.verifyObjectExists()`. In local mode it validates that the key is non-empty and safe; with `STORAGE_VERIFY_MODE=s3`, it performs an S3/MinIO `HeadObject` check. This keeps local development light while preserving the production-shaped dependency boundary.

`DocumentsService.completeUpload()` now calls that verification before marking a document uploaded. If the object cannot be verified, the API returns a clear bad-request error.

The lesson is dependency isolation. The document module should know that storage must be verified, but it should not know how S3 does that verification.
