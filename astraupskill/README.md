# Master1: a repeated save should not rewrite history

A task's completion time describes when the task became done. It should not
silently become the time of the latest edit to an already completed task.
This lesson repairs that behavior in the actual
[TasksService](../apps/api/src/modules/tasks/tasks.service.ts), where every
request containing status DONE previously assigned a fresh Date. An ordinary
repeat save could therefore change the historical completion timestamp.

The repaired service distinguishes a transition into DONE from a repeated
DONE value. A newly completed task receives a timestamp. A task already DONE
retains its existing completedAt value. Reopening clears that value, and an
update that omits status leaves completion fields out of the write payload.
This is a small CRUD change with a larger lesson: fields describing events
should be driven by transitions, not merely by the latest submitted state.

Study the course in three passes. First trace the controller, DTO and service
without changing code. Next compare the original service snapshot with the
changed conditional and predict the update payload for each transition.
Finally run the focused regression and complete the exercises before reading
the answers. The trace table is intended for handwritten predictions, while
the review exercise asks you to defend the distinction between repeated state
and repeated side effects.

The tests invoke the production service logic through a local TypeScript
loader and explicit Prisma and audit doubles. They make timestamp and payload
decisions visible without reinstalling the monorepo dependency tree. They do
not run Nest's HTTP pipeline, class-validator decorators, generated Prisma
queries or a real database. Read the evidence chapter before interpreting
what a passing result establishes.

Completion of this lesson means being able to explain the preserved timestamp,
the reopen behavior and the omitted-field behavior separately. It also means
recognizing the remaining concurrency limitation: another writer can change
the task between this service's read and write. This bounded repair improves
sequential repeated edits; it does not claim that all task updates are atomic
or that the entire request has no repeated side effects.
