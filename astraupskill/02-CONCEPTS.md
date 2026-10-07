# State equality is different from an event

An enum value describes current state. A timestamp such as `completedAt`
describes an event in the resource's history. Receiving `status: "DONE"` does
not mean a completion event just happened: the task may already have been done
when the user opened the form. This matters whenever an edit screen submits
every displayed field, including ones the user did not change.

## The bug in one story

A task is completed Monday morning. On Tuesday someone changes its priority
and the form also sends `DONE`. The original service
([snapshot](snapshots/tasks.service.ts.original.txt), line 56) replaced
Monday's completion time with Tuesday's save time. No work was completed on
Tuesday, yet any report built on `completedAt` (time-to-close, SLA breach)
would now say so. The repaired branch compares the before state with the
requested state and keeps the existing value when both are DONE.

## Four distinct cases

- **Entering DONE** from another status creates a completion timestamp.
- **Repeating DONE** keeps the existing one.
- **Leaving DONE** (any other supplied status) clears it to `null`, which is
  the existing product convention.
- **Omitting status** is not a status operation, so neither `status` nor
  `completedAt` appears in the update payload. Absent and `null` are different
  answers: `null` would actively erase history.

## Stable field is not the same as idempotent request

Repeating DONE no longer changes `completedAt`, but the request still has
other effects every time: Prisma's `@updatedAt` bumps `Task.updatedAt`
(schema.prisma:809) and a new `task.updated` audit row is inserted
(tasks.service.ts:70-77). Say precisely which field is stable rather than
calling the whole endpoint idempotent from one assertion.

## Limits worth naming

- **Legacy data.** A row that is DONE with `completedAt = null` keeps `null` on
  a repeat save. Preserving it does not invent a history; repairing such rows
  is a separate data decision.
- **Concurrency.** The service reads (line 52) and then writes (line 53) with
  no version check. A decision based on a stale `before` is a race, a
  different defect from the sequential repeat-save bug.
- **Audit coverage.** The audit row records only status and priority (lines
  75-76), not `completedAt`, `assigneeId` or `dueAt`. You can reconstruct
  *when* a task was moved to DONE from the audit row's `createdAt`, but not
  what its `completedAt` was set to.

Naming these limits lets you propose focused follow-ups instead of expanding
one small fix into an unreviewable rewrite.
