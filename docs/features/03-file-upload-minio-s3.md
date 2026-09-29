# Feature 03 - File Upload With MinIO/S3

## Plan

### Goal

Add a realistic file-storage boundary for documents. The API should create document metadata and generate a presigned upload URL for MinIO/S3-compatible storage.

### Impacted Codebase Areas

- `packages/config/src/index.ts`: add S3/MinIO configuration.
- `apps/api/package.json`: add AWS S3 SDK dependencies.
- `apps/api/src/modules/storage/*`: new storage module and service.
- `apps/api/src/app.module.ts`: register storage module.
- `apps/api/src/modules/documents/*`: add upload-intent DTO, controller endpoint, and service method.
- `docs/features/03-file-upload-minio-s3.md`: plan and build journal.

### Implementation Approach

1. Add S3 endpoint, credentials, bucket, and region to shared config.
2. Add a `StorageService` that creates an S3 client and generates presigned PUT URLs.
3. Generate deterministic document storage keys by worker id, timestamp, document type, and sanitized filename.
4. Add `POST /workers/:workerId/documents/upload-intent`.
5. Create a `Document` metadata record and return the upload URL plus storage key.

### Design Considerations

- The database stores metadata and storage keys; object storage stores file bytes.
- Presigned URLs keep the API from streaming large files through the Node process.
- The initial implementation assumes the bucket exists. Bucket provisioning can be added later as infrastructure automation.
- Document virus scanning, MIME validation, and upload completion callbacks are future features.

## Build Journal

Implemented:

- Added S3/MinIO settings to shared config and `.env.example`.
- Added AWS S3 client and presigner dependencies to the API.
- Added `StorageModule` and `StorageService`.
- Added presigned PUT URL creation with bucket, key, method, and required headers.
- Added `CreateDocumentUploadIntentDto`.
- Added `POST /workers/:workerId/documents/upload-intent`.
- Added document metadata creation and audit logging for upload intents.

Verification:

- Ran `corepack pnpm install`.
- Ran `corepack pnpm typecheck`.

Lessons learned:

- Document upload is two systems: database metadata and object storage bytes.
- Presigned URLs keep large file transfer out of the API process, which is closer to real SaaS architecture.
- The API should own storage-key generation so frontend code cannot create untracked object paths.
- The next maturity step is upload completion confirmation, file scanning, and bucket provisioning automation.
