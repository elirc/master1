# Locate the transition decision

## Request path

`PATCH /api/tasks/:id` (global prefix set in `apps/api/src/main.ts:10`)

1. **Global pipe** — `main.ts:17-23` installs `ValidationPipe({ whitelist,
   transform, forbidNonWhitelisted })`. Unknown body keys are rejected with
   400 before the controller runs.
2. **Guards** — [TasksController](../apps/api/src/modules/tasks/tasks.controller.ts)
   lines 12-13 apply `AuthGuard` then `PlatformRoleGuard`, requiring one of
   `PLATFORM_ADMIN`, `SUPPORT_AGENT`, `ONBOARDING_SPECIALIST`,
   `PAYROLL_SPECIALIST`. These are platform-staff endpoints, so the absence of
   an organization filter in `update` is by design, not automatically a
   tenant leak. (How `AuthGuard` decides who you are is reviewed in 06.)
3. **Controller** — `update` (lines 27-30) builds a `RequestContext` with
   `contextFromRequest` and forwards `id` and the `UpdateTaskDto`.
4. **DTO** — [update-task.dto.ts](../apps/api/src/modules/tasks/dto/update-task.dto.ts)
   makes every field `@IsOptional()`. `status` must be one of `OPEN`,
   `IN_PROGRESS`, `BLOCKED`, `DONE`, `CANCELLED` (line 5), matching the Prisma
   `TaskStatus` enum (`packages/database/prisma/schema.prisma:189-195`).
   Note that `@IsOptional()` skips validation for `null` as well as
   `undefined`, so `{ "status": null }` reaches the service.
5. **Service** — [TasksService.update](../apps/api/src/modules/tasks/tasks.service.ts),
   lines 51-80:

| Line | Step |
| --- | --- |
| 52 | `findUniqueOrThrow({ where: { id } })` → `before` |
| 56-63 | status branch: writes `status` and the `completedAt` decision |
| 64 | priority (truthiness check) |
| 65 | `assigneeId` (presence check; `""` becomes `null`) |
| 66 | `dueAt` (presence check; falsy becomes `null`) |
| 70-77 | `audit.log("task.updated")` with before/after **status and priority only** |
| 79 | returns the row Prisma returned from the update |

The read at line 52 already provides `before.status` and `before.completedAt`,
so the repair needed no new query or schema field: `Task.completedAt` is
already a nullable `DateTime` (schema.prisma:807).

The audit write at line 70 is a separate awaited call after the update, not
inside `prisma.$transaction` (several other services, such as
`expenses.service.ts:119`, do use transactions). If the audit insert fails, the
task change has already been committed.

## Test path

The focused regression is [tests/tasks-service-completion.test.mjs](../tests/tasks-service-completion.test.mjs).
It loads the service through [tests/helpers/load-typescript.mjs](../tests/helpers/load-typescript.mjs),
which:

- strips standalone decorator lines with a regex (line 40) because Node's
  type stripper cannot parse legacy Nest decorators;
- strips TypeScript types with `stripTypeScriptTypes` (line 41);
- evaluates the module in a `vm` context, resolving `@nestjs/common`, the DTOs,
  `PrismaService` and `AuditService` to stubs supplied by the test (test file
  lines 27-33);
- throws for any unstubbed external import (loader line 52), so a new
  dependency cannot sneak in silently.

The method body under test is the real source. To follow one case, record
four observations: prior status, requested status, the generated
`completedAt` field, and the returned task.
