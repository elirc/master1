# 02 - Database Seed

Source: `packages/database/prisma/seed.ts`

## Why This File Matters

Seed files are more than convenience scripts. In a growing app, seed data creates the first shared reality for developers, tests, demos, and onboarding. A good seed file answers: "What does a normal local environment look like?"

## Line-By-Line Reading Notes

Lines 1-2 import `PrismaClient` and `initialCountryProfiles`. This shows that seed data is not inventing country rules locally; it reuses the shared domain package.

Line 4 creates a Prisma client. This is the object that speaks to PostgreSQL.

Lines 6-88 define `main()`, the seed routine. Keeping the script in a function lets the bottom of the file handle success and error cleanup consistently.

Lines 7-35 loop over country profiles and upsert them. `upsert` means "update if it exists, create if it does not." This is useful for seed scripts because you can run them repeatedly without duplicating records.

Lines 10-19 update existing country rows. If the code changes the required documents for a country, re-running seed updates the row.

Lines 20-34 create missing country rows. `countryName(profile.countryCode)` converts compact codes such as `GB` into display names.

Lines 37-45 upsert the platform admin. This is an internal user, shown by `platformRole: "PLATFORM_ADMIN"`.

Lines 47-55 upsert a demo client owner. This user does not have `platformRole`; their authority comes through organization membership.

Lines 57-70 upsert the demo organization with the hardcoded id `demo-org-acme`. The frontend currently uses this id to make local demo workflows easy.

Lines 72-84 upsert the organization membership connecting the client owner to Acme. The unique key `organizationId_userId` mirrors the compound unique constraint in the Prisma schema.

Lines 86-98 create an audit log that records seed data creation. Even seed scripts can demonstrate production habits: meaningful changes should leave a trace.

Lines 101-109 define `countryName()`. This helper keeps display-name mapping out of the main seed flow.

Lines 111-119 run the script and clean up the Prisma connection. The `catch` block logs the error, disconnects, and exits with code 1 so automation knows the seed failed.

## Codebase Connections

- The frontend uses `demo-org-acme` in `OperationsDashboard`.
- The country rows are used by `HiringService`, `WorkersService`, and the frontend country selector.
- The seeded platform admin is used as a fallback reviewer in `DocumentsService` when no actor header is provided.

## Senior-Level Questions

- Is hardcoding `demo-org-acme` okay for local development? Yes, but production code should not depend on seeded ids.
- Should seeds create realistic data for every workflow? Eventually yes, because demos and integration tests become much easier.
- Should seed scripts be idempotent? Usually yes. This one uses upsert for that reason.
