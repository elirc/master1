# Predict the transition before editing

Each exercise has a **Goal** (write your prediction first) and a **Check** you
run. All checks share one local practice file; nothing is installed and
nothing is committed.

## Setup

Create `tests/practice-tasks.test.mjs` (keep it out of commits) with this
harness. It loads the current service and a copy of the original snapshot
through the repo's own loader, with a fixed clock: T1 is the historical
completion time and T2 is "now".

```js
// tests/practice-tasks.test.mjs  (local practice file: do not commit)
// Run: node --experimental-vm-modules --test tests/practice-tasks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const T1 = new Date('2026-01-02T03:04:05.000Z'); // historical completion
const T2 = new Date('2026-09-21T12:00:00.000Z'); // "now" during the save
class FixedDate extends Date {
  constructor(...a) { super(a.length ? a[0] : T2.getTime()); }
  static now() { return T2.getTime(); }
}
const stubs = {
  '@nestjs/common': { Injectable: () => (t) => t },
  './dto/create-task.dto': { CreateTaskDto: class {} },
  './dto/update-task.dto': { UpdateTaskDto: class {} },
  '../prisma/services/audit.service': { AuditService: class {} },
  '../prisma/services/prisma.service': { PrismaService: class {} },
};
const load = async (root, file) =>
  (await loadTypeScript(file, { root, aliasRoot: root, globals: { Date: FixedDate }, stubs })).TasksService;

const Current = await load(REPO, 'apps/api/src/modules/tasks/tasks.service.ts');
// The loader only strips TypeScript from *.ts files inside `root`, so copy the snapshot out.
const origDir = await mkdtemp(path.join(tmpdir(), 'tasks-orig-'));
await copyFile(path.join(REPO, 'astraupskill/snapshots/tasks.service.ts.original.txt'),
  path.join(origDir, 'tasks.service.ts'));
const Original = await load(origDir, 'tasks.service.ts');

function harness(Service, before) {
  const updates = [], audits = [];
  const prisma = { task: {
    async findUniqueOrThrow() { return before; },
    async update(a) { updates.push(a); return { ...before, ...a.data }; } } };
  return { svc: new Service(prisma, { async log(a) { audits.push(a); } }), updates, audits };
}
const done = () => ({ id: 't', organizationId: 'o', status: 'DONE', priority: 'NORMAL', completedAt: T1 });
const ctx = { actorId: 'u' };
```

Append each exercise's Check block to the file, then run:

```text
node --experimental-vm-modules --test tests/practice-tasks.test.mjs
```

With all six appended you should see `# pass 6`, `# fail 0`. If a check
fails, your prediction or the code differs from this guide: find out which
before reading [06](06-SOLUTIONS-AND-REVIEW.md).

## Exercise 1: Payload prediction

**Goal.** Start from a DONE task completed at T1. Predict the `data` object sent to
`prisma.task.update` for four bodies: `{status:"DONE"}`, `{status:"OPEN"}`,
`{priority:"HIGH"}` and `{}`. For each, say whether `completedAt` is
preserved, cleared or absent, and whether an audit row is still written.

**Check.**

```js
test('E1 payload predictions', async () => {
  let h = harness(Current, done()); await h.svc.update(ctx, 't', { status: 'DONE' });
  assert.equal(h.updates[0].data.completedAt, T1);
  h = harness(Current, done()); await h.svc.update(ctx, 't', { status: 'OPEN' });
  assert.equal(h.updates[0].data.completedAt, null);
  h = harness(Current, done()); await h.svc.update(ctx, 't', { priority: 'HIGH' });
  assert.deepEqual(Object.entries(h.updates[0].data), [['priority', 'HIGH']]);
  h = harness(Current, done()); await h.svc.update(ctx, 't', {});
  assert.deepEqual(Object.keys(h.updates[0].data), []);
  assert.equal(h.audits.length, 1);
});
```

## Exercise 2: Prove the regression test bites

**Goal.** A teammate's test only checks that saving DONE produces a `completedAt` that
is a `Date`. Run that weak assertion and the exact-value assertion against
the **original** service (the snapshot) and explain which one would have caught
the bug.

**Check.**

```js
test('E2 weak vs exact assertion against the original snapshot', async () => {
  const h = harness(Original, done()); await h.svc.update(ctx, 't', { status: 'DONE' });
  assert.ok(h.updates[0].data.completedAt instanceof Date);              // weak: passes on the bug
  assert.equal(h.updates[0].data.completedAt.getTime(), T2.getTime());   // the bug: T2 replaced T1
});
```

## Exercise 3: Null status

**Goal.** Predict what `{ "status": null, "priority": "LOW" }` writes. (Reminder:
`@IsOptional()` lets `null` through validation, so this body reaches the
service.)

**Check.**

```js
test('E3 status:null behaves like an omitted status', async () => {
  const h = harness(Current, done()); await h.svc.update(ctx, 't', { status: null, priority: 'LOW' });
  assert.deepEqual(Object.keys(h.updates[0].data), ['priority']);
});
```

## Exercise 4: Stale read between two writers

**Goal.** Writer A reads the task while it is OPEN, then pauses. Writer B completes the
task at T1. A resumes and sends DONE. Predict the final `completedAt`, then
propose a guard (for example `updateMany({ where: { id, status: before.status } })`
and checking `count`, or a version column) and the observable failure it
would produce for A.

**Check.**

```js
test('E4 stale read: writer A overwrites B\'s completion time', async () => {
  let row = { id: 't', organizationId: 'o', status: 'OPEN', priority: 'NORMAL', completedAt: null };
  let release; const gate = new Promise((r) => { release = r; });
  let reads = 0;
  const prisma = { task: {
    async findUniqueOrThrow() { const snap = { ...row }; if (reads++ === 0) await gate; return snap; },
    async update({ data }) { row = { ...row, ...data }; return { ...row }; } } };
  const svc = new Current(prisma, { async log() {} });
  const a = svc.update(ctx, 't', { status: 'DONE' });       // A reads OPEN, then pauses
  await new Promise((r) => setImmediate(r));
  row = { ...row, status: 'DONE', completedAt: T1 };         // B completes at T1
  release(); await a;
  assert.equal(row.completedAt.getTime(), T2.getTime());    // T1 is lost
});
```

## Exercise 5: Unknown task id

**Goal.** Predict what `update` does when `findUniqueOrThrow` rejects with Prisma's
`P2025` "record not found" error: is anything written or audited, and what
HTTP status would a client see given there is no exception filter in
`apps/api/src`?

**Check.**

```js
test('E5 unknown id: no write, no audit, raw Prisma error escapes', async () => {
  const updates = [], audits = [];
  const err = Object.assign(new Error('No Task found'), { code: 'P2025' });
  const prisma = { task: { async findUniqueOrThrow() { throw err; }, async update(a) { updates.push(a); } } };
  const svc = new Current(prisma, { async log(a) { audits.push(a); } });
  await assert.rejects(svc.update(ctx, 'missing', { status: 'DONE' }), { code: 'P2025' });
  assert.equal(updates.length + audits.length, 0);
});
```

## Exercise 6: Legacy DONE row with no timestamp

**Goal.** A row is DONE with `completedAt = null` (data from before the field was
populated). Predict what a repeat DONE save writes. Then decide, in writing,
whether a separate repair should keep `null`, stamp "now", or recover the
time from the earliest `task.updated` audit row whose `after.status` is
DONE, and list the evidence each choice needs.

**Check.**

```js
test('E6 legacy DONE row with null completedAt stays null', async () => {
  const h = harness(Current, { ...done(), completedAt: null }); await h.svc.update(ctx, 't', { status: 'DONE' });
  assert.equal(h.updates[0].data.completedAt, null);
});
```
