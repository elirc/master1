# Assert payloads, not merely Date-shaped values

The focused suite constructs TasksService with explicit task repository and
audit doubles. The task read returns a known prior record; the update double
captures the data object and returns the resulting record. This makes it
possible to observe what would be sent to persistence without needing a
database or the full Nest application. The service method itself remains
the actual source under test.

For repeat DONE, use a fixed historical completion time and assert exact
preservation in the update payload. For first completion, a controlled clock
lets the fixture assert the intended current instant rather than merely
checking that an object has a getTime method. For reopening, assert null.
For omitted status, assert absence of the completedAt key rather than treating
undefined and null as interchangeable values.

Those distinctions catch different regressions. A test that accepts any Date
would let the original repeat-save defect pass. A test that checks only the
returned task could hide an incorrect write if the double returned a canned
object. A test that ignores key presence could miss an unintended null field
being sent during a priority-only update. Record and inspect the actual
arguments at the persistence boundary.

If a case fails, inspect the before status and requested status first. Then
inspect the selected branch and generated data. Only after that inspect the
repository or transport adapter. The order keeps a small business-rule bug
from turning into an unfocused debugging session across the whole monorepo.

The loader removes standalone decorator syntax because the dependency-free
Node transformer does not execute Nest decorators. DTO classes, Prisma and
audit dependencies are substituted. Consequently, these checks do not prove
HTTP validation, dependency injection, authentication or SQL behavior. A later
integration test should submit a real PATCH through the configured application
and inspect persisted completion time. Keep that proposed experiment separate
from the captured focused run, and retain failed attempts instead of presenting
them as evidence that the final implementation passed.
