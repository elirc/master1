# Feature 41 - Database Migration Discipline

## Plan

### Goal

Add documentation and scripts that teach how schema changes should move through migration review.

### Impacted Codebase Areas

- `docs/DATABASE_MIGRATION_GUIDE.md`: migration workflow guide.
- `package.json`: add migration status/check script.
- `.github/workflows/ci.yml`: include migration/schema verification where possible.
- `docs/features/41-database-migration-discipline.md`: plan and build journal.

### Implementation Approach

1. Document local migration creation and review flow.
2. Add a root script for Prisma schema validation.
3. Add CI validation step.
4. Explain when to use `db push` versus migrations.
5. Keep actual migration generation manual for this learning repo.

### Design Considerations

- Migration discipline is process plus tooling.
- Production teams review migration SQL, not only Prisma schema diffs.
- This repo can still use generated clients locally while learning migration habits.

## Build Journal

Added `docs/DATABASE_MIGRATION_GUIDE.md`, a cross-platform `scripts/validate-prisma.mjs`, a root `db:validate` script, and a CI validation step.

The important design lesson is that migration discipline is both tooling and habit. Schema validation is the start; production teams also review generated SQL and rollout strategy.
