import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadTypeScript } from './helpers/load-typescript.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixedNow = new Date('2026-09-21T12:00:00.000Z');
class FixedDate extends Date {
  constructor(...args) { super(args.length ? args[0] : fixedNow.getTime()); }
  static now() { return fixedNow.getTime(); }
}
const updateCalls = [];
const auditCalls = [];
let before;
const prisma = {
  task: {
    async findUniqueOrThrow() { return before; },
    async update(args) { updateCalls.push(args); return { ...before, ...args.data }; },
  },
};
const audit = { async log(args) { auditCalls.push(args); } };
const { TasksService } = await loadTypeScript('apps/api/src/modules/tasks/tasks.service.ts', {
  root,
  aliasRoot: path.join(root, 'apps/api/src'),
  globals: { Date: FixedDate },
  stubs: {
    '@nestjs/common': { Injectable: () => (target) => target },
    './dto/create-task.dto': { CreateTaskDto: class {} },
    './dto/update-task.dto': { UpdateTaskDto: class {} },
    '../prisma/services/audit.service': { AuditService: class {} },
    '../prisma/services/prisma.service': { PrismaService: class {} },
  },
});
const service = new TasksService(prisma, audit);

function reset(task) {
  before = task;
  updateCalls.length = 0;
  auditCalls.length = 0;
}

test('re-saving an already DONE task preserves its completion timestamp', async () => {
  const completedAt = new Date('2026-01-02T03:04:05.000Z');
  reset({ id: 'task-1', organizationId: 'org-1', status: 'DONE', priority: 'NORMAL', completedAt });
  await service.update({ actorId: 'user-1', organizationId: 'org-1' }, 'task-1', { status: 'DONE' });
  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].data.status, 'DONE');
  assert.equal(updateCalls[0].data.completedAt, completedAt);
});

test('transitioning into DONE stamps completion and reopening clears it', async () => {
  reset({ id: 'task-1', organizationId: 'org-1', status: 'IN_PROGRESS', priority: 'NORMAL', completedAt: null });
  await service.update({ actorId: 'user-1', organizationId: 'org-1' }, 'task-1', { status: 'DONE' });
  assert.equal(updateCalls[0].data.status, 'DONE');
  assert.equal(updateCalls[0].data.completedAt.getTime(), fixedNow.getTime());

  reset({ id: 'task-1', organizationId: 'org-1', status: 'DONE', priority: 'NORMAL', completedAt: new Date('2026-01-02T03:04:05.000Z') });
  await service.update({ actorId: 'user-1', organizationId: 'org-1' }, 'task-1', { status: 'OPEN' });
  assert.equal(updateCalls[0].data.status, 'OPEN');
  assert.equal(updateCalls[0].data.completedAt, null);
});

test('omitting status leaves completion untouched', async () => {
  const completedAt = new Date('2026-01-02T03:04:05.000Z');
  reset({ id: 'task-1', organizationId: 'org-1', status: 'DONE', priority: 'NORMAL', completedAt });
  await service.update({ actorId: 'user-1', organizationId: 'org-1' }, 'task-1', { priority: 'HIGH' });
  assert.deepEqual(Object.keys(updateCalls[0].data), ['priority']);
  assert.equal(auditCalls.length, 1);
});
