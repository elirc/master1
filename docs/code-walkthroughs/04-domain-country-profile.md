# 04 - Country Profile

Source: `packages/domain/src/country-profile.ts`

## Why This File Matters

Country rules are the core complexity of an EOR platform. This file models the first version of those rules as data. That is an important architectural choice: data-driven rules are easier to inspect, seed, and change than scattered conditionals.

## Line-By-Line Reading Notes

Line 1 imports `CurrencyCode` from the money helper. That connects country configuration to the app's money vocabulary.

Line 3 defines supported country codes: `US`, `CA`, and `GB`.

Lines 5-11 define supported worker document types. These strings are used by country profiles, document upload DTOs, and activation checks.

Lines 13-23 define the `CountryProfile` interface. This is the shape the rest of the code expects.

Line 15 stores the country code.

Line 16 stores the default currency. `HiringService` uses this to reject salary currency mismatches.

Line 17 defines payroll frequency. The initial payroll implementation does not fully use it yet, but this field shows where country-specific payroll scheduling would grow.

Line 18 stores standard work week hours.

Lines 19-20 store required onboarding documents and required contract fields.

Line 21 stores annual PTO days.

Line 22 stores employer cost as basis points. Basis points avoid floating-point percentages. For example, `1600` means 16.00%.

Lines 25-66 define the initial country profiles. These are imported by the seed script and inserted into the database.

Lines 27-39 define the United States profile. Notice the `BIWEEKLY` payroll frequency and required work authorization.

Lines 40-52 define Canada. It requires fewer documents than the US in this simplified model.

Lines 53-65 define Great Britain. It has 28 PTO days and a higher employer cost rate in this demo data.

## Codebase Connections

- `packages/database/prisma/seed.ts` inserts these profiles into PostgreSQL.
- `HiringService.create()` checks `defaultCurrency`.
- `WorkersService.activate()` checks `requiredWorkerDocuments`.
- `OperationsDashboard` displays countries and uses `defaultCurrency` when creating hire requests.

## Senior-Level Questions

- When should country rules stay in data versus become code?
- How would you version these rules when laws change?
- How would you support effective dates so old contracts keep old rules?
