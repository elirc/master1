# Feature 19 - Document Review Dashboard

## Plan

### Goal

Add a document review queue to help operations users inspect uploaded worker documents and approve or reject them.

### Impacted Codebase Areas

- `apps/api/src/modules/documents/*`: add queue/list endpoint for document review.
- `apps/web/app/ui/operations-dashboard.tsx`: add document queue view and review actions.
- `apps/web/app/globals.css`: add table/status treatment as needed.
- `docs/features/19-document-review-dashboard.md`: plan and build journal.

### Implementation Approach

1. Add `GET /documents/review-queue` with organization and status filters.
2. Return document, worker, and review metadata needed by the UI.
3. Add dashboard state for review queue documents.
4. Render approve/reject actions that call the existing review endpoint.
5. Refresh queue and worker summaries after review.

### Design Considerations

- Review queues are operational tools; they should be filterable, scannable, and action-oriented.
- The API owns tenant and role authorization.
- A future version should show file preview links and review history.

## Build Journal

Added `GET /documents/review-queue` to the documents module. It returns paginated document rows with worker context and recent review metadata, filtered by organization and status. The operations console now renders those rows and calls the existing review endpoint for approve/reject actions.

Upload completion now has a stronger boundary too: before a document moves from `PENDING_UPLOAD` to `UPLOADED`, the document service asks the storage service to verify the object key.

The lesson is queue design. Reviewers need a purpose-built list that includes enough context to act without loading every worker manually.
