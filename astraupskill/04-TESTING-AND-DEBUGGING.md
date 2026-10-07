# Assert payloads, not merely Date-shaped values

## Run it

From the repo root (Node 22.13+; no install needed):

```text
node --experimental-vm-modules --test tests/tasks-service-completion.test.mjs
```

Expected tail: `# tests 3`, `# pass 3`, `# fail 0`, plus an
`ExperimentalWarning: VM Modules` line, which is harmless.

## What the suite controls

[tests/tasks-service-completion.test.mjs](../tests/tasks-service-completion.test.mjs):

- **Clock** (lines 8-12): `FixedDate` makes `new Date()` return
  `2026-09-21T12:00:00Z`; it is injected as the vm context's `Date` (line 26),
  so the service's `new Date()` is deterministic.
- **Prisma double** (lines 16-21): `findUniqueOrThrow` returns the `before`
  you set; `update` records its argument and returns `{ ...before, ...data }`.
- **Audit double** (line 22): records each `log` call.

| Test | Asserts |
| --- | --- |
| 1 (lines 43-50) | repeat DONE writes the *same* `Date` object that `before` held |
| 2 (lines 52-62) | IN_PROGRESS → DONE writes the fixed clock instant; DONE → OPEN writes `null` |
| 3 (lines 64-70) | priority-only edit: `Object.keys(data)` is exactly `['priority']`; one audit call |

## Why these assertions

- A test that accepts any `Date` passes on the original bug too; test 1
  pins the exact historical value.
- Test 2's first half fails if someone "fixes" the bug by always reusing
  `before.completedAt` (`null.getTime()` throws).
- Test 3 checks key presence, which catches an unintended `completedAt: null`
  in a priority-only update. Comparing only the returned task could hide a
  wrong write, because the double echoes whatever `data` was sent.

## A cross-realm gotcha

The service runs inside a `vm` context, so objects it creates have that
context's `Object.prototype`. `assert.deepEqual(data, { priority: 'HIGH' })`
fails with *"Values have same structure but are not reference-equal"* even
though the contents match. That is why test 3 compares `Object.keys(...)`.
Compare `Object.keys` / `Object.entries` arrays (created in your realm) or
individual fields instead.

## Debugging order

If a case fails: check `before.status` and the requested status first, then
which branch of lines 56-63 was taken, then the generated `data`, and only
then the doubles. This keeps a one-line business-rule bug from becoming a
monorepo-wide hunt.

## What this does not prove

Decorators are deleted and DTO, Prisma and audit classes are stubs, so the
suite proves nothing about HTTP validation, dependency injection,
authentication or SQL. The API's Jest e2e file (`apps/api/src/app.e2e.ts`)
currently covers only the health endpoint, so no automated test sends a real
`PATCH /api/tasks/:id`. A proper follow-up would PATCH a seeded DONE row
through the Nest app and read back the persisted `completedAt`.
