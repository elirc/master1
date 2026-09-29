# Database Migration Guide

This project is still learning-oriented, but schema changes should be treated like production changes.

## Local Flow

1. Edit `packages/database/prisma/schema.prisma`.
2. Run `corepack pnpm db:validate`.
3. Run `corepack pnpm db:generate`.
4. For local disposable databases, `corepack pnpm --filter @globalwork/database db:push` is acceptable.
5. For shared environments, create and review a Prisma migration before deploy.

## Review Checklist

- Does the schema change preserve existing data?
- Are nullable columns intentional?
- Does every new relation have a clear owner?
- Are unique constraints safe for existing tenants?
- Are backfills needed before enforcing required fields?
- Can the app run during a rolling deploy?

## Production Discipline

Prefer expand-and-contract migrations:

1. Add nullable columns or new tables.
2. Deploy code that writes both old and new shapes if needed.
3. Backfill data.
4. Add constraints after data is valid.
5. Remove old columns only after readers are migrated.

The goal is to make database changes boring, reviewable, and reversible enough that they do not become the scary part of shipping.
