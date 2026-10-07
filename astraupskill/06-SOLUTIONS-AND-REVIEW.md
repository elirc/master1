# Answers: preserve the meaning of each field

## Exercise answers

**1. Payload prediction.** Repeat DONE → `{ status: "DONE", completedAt: T1 }`.
OPEN → `{ status: "OPEN", completedAt: null }`. Priority-only →
`{ priority: "HIGH" }` with no completion keys. Empty body → `{}`; the service
still calls `prisma.task.update` with an empty `data` and still writes one
`task.updated` audit row.

**2. Proving the test bites.** Against the original snapshot the weak
`instanceof Date` assertion passes, because a fresh T2 is also a `Date`. Only
the exact value distinguishes T1 from T2: the original writes T2, the current
code writes T1. The existing suite's test 2 is the complementary guard: it
fails if a fix always reuses `before.completedAt`.

**3. Null status.** `{ status: null, priority: "LOW" }` writes only
`{ priority: "LOW" }`: the truthiness check at tasks.service.ts:56 treats
`null` like an omitted status. This is why 03 warns against switching to a
presence check.

**4. Stale read.** A's `before` says OPEN, so it takes the "entering DONE"
path and writes T2, destroying B's T1. The patch is correct for the record it
read; it cannot see that the record changed. A conditional write such as
`updateMany({ where: { id, status: before.status }, data })` returns
`count: 0` when the status moved underneath A, and the service could then
re-read or return 409. Testing that needs two coordinated writers against a
real database; the sequential fixture cannot establish it.

**5. Unknown id.** Nothing is written or audited; the `P2025` error escapes
`update` unchanged. There is no `@Catch`/`ExceptionFilter` anywhere in
`apps/api/src`, and Nest's default handler turns any non-`HttpException` into
**500 Internal server error**, so a typo'd id looks like a server fault rather
than a 404 (see finding 2).

**6. Legacy null.** A repeat DONE preserves `null`. Stamping now would invent
a completion event. The audit log can give the time a task was *moved* to DONE
(`AuditLog.createdAt` on a `task.updated` row with `before.status != DONE` and
`after.status == DONE`), but only for moves made through this service after
auditing existed; rows completed by seed data or other paths have no such
evidence. A repair needs a written policy for missing and conflicting history.

## Senior review findings

These were found by reading the code around the lesson. Line numbers are
against the current `main`.

1. **Unconditional `x-user-id` authentication (high).**
   `apps/api/src/modules/auth/auth.guard.ts:18-21`: if there is no Bearer
   token, any request carrying `x-user-id: <id>` is authenticated as that user
   via `principalForUser` (`auth.service.ts:115-131`), with no environment or
   secret check. Anyone who knows or guesses a platform admin's id passes
   `PlatformRoleGuard` on every task endpoint. The header looks like a
   development convenience; it should be gated on an explicit dev-only flag
   and rejected otherwise. Related: `JWT_SECRET` defaults to
   `"development-secret"` (`packages/config/src/index.ts:8`), so a deployment
   that forgets to set it signs tokens with a public value.

2. **Not-found becomes 500 (medium).** `tasks.service.ts:52` uses
   `findUniqueOrThrow`, and no exception filter maps Prisma's `P2025`. Clients
   and monitoring cannot tell "wrong id" from "server broke". Fix: catch
   `P2025` and throw `NotFoundException`, or add one Prisma exception filter.

3. **Unvalidated list filter (medium).** `GET /api/tasks?status=...` passes the
   raw query string into Prisma with `status as never`
   (`tasks.controller.ts:18` → `tasks.service.ts:19`). `as never` silences the
   compiler instead of validating; an unknown value makes Prisma reject the
   query and the client gets a 500. A query DTO with `@IsIn([...])` would give
   a 400.

4. **Assignee is not checked against the task's organization (medium).**
   `tasks.service.ts:65` writes any string as `assigneeId`. The foreign key
   (`schema.prisma:811`) only ensures the user exists (a nonexistent id is
   another unhandled 500); nothing checks that the assignee belongs to
   `task.organizationId`, so a task for one client can be assigned to a user
   who is only a member of another.

5. **Audit is partial and outside the write (low/medium).** The audit row
   records only status and priority (lines 75-76), so assignee, due-date and
   completion changes leave no trail. It is also written after the update
   without a transaction (lines 53-77), so a failed audit insert leaves an
   unaudited change. `expenses.service.ts:119` shows the repo's own
   `$transaction` pattern to copy.

6. **No-op updates still write (low).** An empty body issues an update and an
   audit row (exercise 1). Harmless today, but if anything downstream ever
   reacts to `task.updated`, repeated saves will trigger it repeatedly;
   timestamp stability does not make the request idempotent.

## How to write it up

Keep three things separate in a review: the request-level defect fixed here
(repeat DONE), legacy data quality (DONE rows with null), and concurrent
writes (stale `before`). One conditional does not solve all three, and saying
so precisely is what makes the review useful.
