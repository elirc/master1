# Evidence and limits of the completion-time fix

## What changed

One hunk in `apps/api/src/modules/tasks/tasks.service.ts` (lines 56-63). The
pre-fix file is kept as [the original snapshot](snapshots/tasks.service.ts.original.txt);
`diff` against the current file shows only that hunk (see
[03](03-WORKED-CHANGE.md)).

## How to re-run the evidence

From the repo root, with Node 22.13 or newer (the loader calls
`module.stripTypeScriptTypes`) and no install:

```text
node --experimental-vm-modules --test tests/tasks-service-completion.test.mjs
```

Re-verified 2026-10-06 on Node 22.16.0: `# tests 3`, `# pass 3`, `# fail 0`.
The six practice checks in [05](05-PRACTICE.md) were also run on that date
against the current service and the snapshot: `# pass 6`, `# fail 0`.

## What the passing run covers

- repeat DONE preserves the saved instant (same `Date` reference);
- entering DONE writes the controlled clock instant;
- reopening writes `null`;
- a priority-only edit sends exactly `['priority']` and logs one audit row.

## What it does not cover

The loader deletes decorator lines and the test stubs DTOs, `PrismaService`
and `AuditService`. So no claim is made about Nest routing, guards,
class-validator, dependency injection, generated Prisma queries, a real
database or a full build. Concurrent writers, atomic task-plus-audit
persistence and legacy-row repair are open questions, and the unrelated
findings in [06](06-SOLUTIONS-AND-REVIEW.md) (dev-header auth, 500 on unknown
id) are untested.

The stronger next experiment is a real `PATCH /api/tasks/:id` against a seeded
DONE row with a known `completedAt`, followed by reading the row back; then
two coordinated writers if you want to claim race protection. Keep the evidence
types distinct in your own reports: source reading, focused execution, and
integration behavior each prove different things.

## Frozen Astra record

[evidence/results.json](evidence/results.json) is the original 2026-09-22
capture (3 tests, exit code 0, about 8 s). It is kept unedited as a historical
record. Its `cwd` field is a path on the authoring machine, not a path you
need, and the `crud-b02-runtime2.log` file it names was never committed to this
repo; use the re-run above as the live evidence.
