# Use the before state already in hand

## The diff

`diff astraupskill/snapshots/tasks.service.ts.original.txt apps/api/src/modules/tasks/tasks.service.ts`
shows exactly one hunk:

```diff
-        ...(dto.status ? { status: dto.status, completedAt: dto.status === "DONE" ? new Date() : null } : {}),
+        ...(dto.status
+          ? {
+              status: dto.status,
+              completedAt: dto.status === "DONE"
+                ? (before.status === "DONE" ? before.completedAt : new Date())
+                : null
+            }
+          : {}),
```

The original decided from the requested value alone. That handled first
completion (`new Date()`) and reopening (`null`) correctly, but it could not
tell a repeat DONE save from a new completion.

## Why this shape

- `before` was already loaded at line 52, so the fix adds no query.
- The outer `dto.status ? … : {}` is kept, so priority, assignee or due-date
  edits add no completion fields.
- The `where: { id }` predicate, the audit call (lines 70-77) and the return
  of Prisma's updated row (line 79) are unchanged. A timestamp repair should
  not accidentally return the stale `before`, add reads, or skip auditing.

## Worked example

Saved task: `status DONE`, `completedAt 2026-01-02T03:04:05Z`.

| Request body | `data` passed to `prisma.task.update` |
| --- | --- |
| `{ "status": "DONE" }` | `{ status: "DONE", completedAt: 2026-01-02T03:04:05Z }` |
| `{ "status": "OPEN" }` | `{ status: "OPEN", completedAt: null }` |
| `{ "priority": "HIGH" }` | `{ priority: "HIGH" }` |

You will assert each row in [05-PRACTICE](05-PRACTICE.md), exercise 1.

## Do not "tidy" the truthiness check

It is tempting to change `dto.status ? …` to `dto.status !== undefined ? …`
to match the presence checks on lines 65-66. That changes runtime behavior.
`@IsOptional()` lets `null` through validation (see 01), so a body of
`{ "status": null }` currently skips the branch (the falsy value is ignored),
whereas the presence check would pass `status: null` for a required enum
field, which Prisma rejects as an invalid argument (an unhandled error, so a
500; see 06). Leave unrelated conditions alone unless the
new contract is decided and tested. Exercise 3 checks the current behavior.

When you review the final diff, explain every changed condition in terms of
observable behavior: which key appears in `data`, and with which value.
