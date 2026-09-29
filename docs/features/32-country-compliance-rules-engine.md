# Feature 32 - Country Compliance Rules Engine

## Plan

### Goal

Add configurable country compliance rules and an evaluation endpoint for worker onboarding.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add compliance rule model.
- `apps/api/src/modules/compliance/*`: new module.
- `apps/api/src/app.module.ts`: register module.
- `docs/features/32-country-compliance-rules-engine.md`: plan and build journal.

### Implementation Approach

1. Add rules by country, category, severity, and JSON config.
2. Add list/upsert endpoints for platform compliance users.
3. Add worker evaluation endpoint that checks required documents/profile.
4. Return blocking and warning findings.
5. Audit rule changes.

### Design Considerations

- This is a rules engine seed, not a fully dynamic policy language.
- Rules should be data-driven enough to evolve without code changes.
- Evaluation output should be explainable to operators.

## Build Journal

Added compliance rules with country, scope, severity, category, and JSON config. The compliance module can upsert/list rules and evaluate a worker for profile/document blockers.

The important design lesson is explainable rules. A useful rules engine should return findings operators can understand, not only a pass/fail boolean.
