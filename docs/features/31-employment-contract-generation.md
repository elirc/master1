# Feature 31 - Employment Contract Generation

## Plan

### Goal

Generate a simple employment contract artifact from worker, organization, and employment data.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add employment contract model.
- `apps/api/src/modules/contracts/*`: new module for generation/listing.
- `apps/api/src/app.module.ts`: register module.
- `docs/features/31-employment-contract-generation.md`: plan and build journal.

### Implementation Approach

1. Add contract status/model.
2. Generate deterministic HTML from employment data.
3. Store storage key, status, and generated timestamp.
4. Audit generation.
5. Keep signature workflow for a future feature.

### Design Considerations

- Contracts are artifacts derived from employment records.
- The generated output should be reproducible enough for local learning.
- Country-specific templates can be layered later.

## Build Journal

Added an employment contracts module. It generates deterministic HTML from worker, organization, and employment data, stores a contract record, and audits generation.

The important design lesson is artifact modeling. The employment record is the source; the contract is a generated artifact that can later gain signature and template workflows.
