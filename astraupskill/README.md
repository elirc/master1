# Master1: a repeated save should not rewrite history

Master1 is the GlobalWork EOR platform: a pnpm/Turborepo monorepo with a
NestJS 11 API (`apps/api`), a Next.js web app (`apps/web`), a BullMQ worker
(`apps/worker`) and shared packages (`packages/database` holds the Prisma
schema, `packages/domain` the pure rules). This lesson touches one service in
that system.

A task's completion time describes when the task became done. It should not
become the time of the latest edit to an already completed task. Before this
repair,
[TasksService.update](../apps/api/src/modules/tasks/tasks.service.ts) assigned
`new Date()` whenever a request carried `status: "DONE"`, so an ordinary
re-save of a finished task overwrote its historical `completedAt`.

The repaired service (tasks.service.ts:56-63) distinguishes a transition into
DONE from a repeated DONE value:

| Request | Before | `completedAt` written |
| --- | --- | --- |
| `DONE` | not DONE | `new Date()` |
| `DONE` | DONE | `before.completedAt` (unchanged) |
| any other status | anything | `null` |
| status omitted | anything | key absent from the payload |

The general lesson: fields that describe an *event* should be driven by
transitions, not by the latest submitted *state*.

## How to study it

1. [01-CODEBASE-MAP](01-CODEBASE-MAP.md): trace controller → DTO → service
   without changing code.
2. [02-CONCEPTS](02-CONCEPTS.md) and [03-WORKED-CHANGE](03-WORKED-CHANGE.md):
   compare the [original snapshot](snapshots/tasks.service.ts.original.txt)
   with the current conditional.
3. [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md): run the focused
   regression.
4. [05-PRACTICE](05-PRACTICE.md): six Goal + Check exercises you run with
   `node --test`; answers and senior review findings in
   [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md).
5. [07-TRACE-LAB](07-TRACE-LAB.md): hand-trace the table above, including the
   concurrent-writer case.
6. [VERIFICATION](VERIFICATION.md): what the passing run does and does not
   prove.

Requirements: Node 22.13+ (the loader uses `module.stripTypeScriptTypes`);
no `pnpm install`, database or Docker is needed. The tests load the real
service source with explicit Prisma and audit doubles, so they do not exercise
Nest's HTTP pipeline, class-validator, generated Prisma queries or a real
database.

You are done when you can explain the preserved timestamp, the reopen
behavior and the omitted-field behavior separately, and can name the
remaining gap: another writer can change the task between this service's read
(line 52) and its write (line 53). The repair fixes sequential repeat saves; it
does not make task updates atomic.
