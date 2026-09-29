# Locate the transition decision

The [TasksController](../apps/api/src/modules/tasks/tasks.controller.ts) exposes
list, create and update operations. Its update method obtains request context,
reads the route identifier and forwards an UpdateTaskDto to TasksService.update.
The controller is guarded by authentication and platform roles. These are
platform task operations; do not assume that a missing organization filter
is automatically a defect without understanding those roles and their scope.

The [update DTO](../apps/api/src/modules/tasks/dto/update-task.dto.ts) describes
optional status, priority, assignee and due-date inputs. Its supported status
values include OPEN, IN_PROGRESS, BLOCKED, DONE and CANCELLED. The service
receives a partial edit, so absence of status must not reset completion time.
Read the DTO together with the service rather than treating the TypeScript
optional marker as a complete description of runtime validation.

TasksService.update first reads the existing task, constructs a Prisma update
payload, performs the update, writes an audit record and returns the updated
task. The existing record is already available for deciding whether DONE is
a new transition. The patch therefore needs no new database query or schema
field. It changes the completedAt decision inside the existing status branch.

Audit logging records the before and after status and priority. It remains a
separate awaited operation following persistence. The repair does not make
the task write and audit write transactional, and it does not suppress audit
events for repeat saves. Keep those facts separate from preservation of the
completion timestamp.

The focused regression lives in [the service test](../tests/tasks-service-completion.test.mjs).
It supplies the task read result, records update arguments and records audit
calls. Its local loader removes standalone Nest decorator syntax before
Node's TypeScript transformation; the method body being exercised is the
actual service source. Draw the flow with four observations: prior status,
requested status, generated completedAt field and returned task. That map
makes the intended transition behavior inspectable without needing the entire
platform running at once.
