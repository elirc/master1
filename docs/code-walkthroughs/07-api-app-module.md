# 07 - API App Module

Source: `apps/api/src/app.module.ts`

## Why This File Matters

NestJS apps are built from modules. This file is the table of contents for the backend. When you enter a Nest codebase, the root module tells you what capabilities exist.

## Line-By-Line Reading Notes

Lines 1-11 import all feature modules. The names are intentionally domain-oriented: countries, documents, hiring, invoices, notifications, organizations, payroll, workers.

Line 12 imports `PrismaModule`, which provides database and audit services globally.

Lines 14-30 define `AppModule`.

Lines 16-29 list imported modules. The order does not usually express business flow, but it does reveal application composition.

`PrismaModule` appears first because many other modules depend on Prisma-backed services.

`HealthModule` is a small operational module.

`CountriesModule` supports configuration queries.

`OrganizationsModule`, `HiringModule`, `WorkersModule`, and `DocumentsModule` form the onboarding side of the app.

`PayrollModule` and `InvoicesModule` form the financial side.

`NotificationsModule` exposes notification records.

## Codebase Connections

- If a controller is not reachable, check whether its module is imported here.
- If a provider cannot be injected, check whether its module exports it and whether this module imports that module.
- `PrismaModule` is marked global, so most modules can inject `PrismaService` without importing Prisma directly.

## Senior-Level Questions

- Are modules grouped by technical layer or business domain? Here they are grouped by business domain.
- Should notifications become a shared service instead of only a query module?
- As the app grows, should internal admin features get their own module?
