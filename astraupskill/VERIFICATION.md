# Evidence and limits of the completion-time fix

The production change is confined to the task update service. Its original
file is retained in [the original snapshot](snapshots/tasks.service.ts.original.txt)
for direct comparison. The regression loads the
service's method body, provides controlled prior records and inspects update
and audit calls. Captured execution evidence is attached after the final
reviewed run, with its command, exit status and actual test count.

Run the focused suite from the project root using the local Node loader:

```text
node --experimental-vm-modules --test tests/tasks-service-completion.test.mjs
```

The loader transforms TypeScript with Node and removes standalone decorator
syntax. It does not run Nest's dependency-injection or routing system. Explicit
DTO, Prisma and audit substitutes make service decisions observable without
installing all workspace packages. Those substitutions must remain visible
when reporting the result; a passing service case is not a passing HTTP or
database integration suite.

The intended evidence covers repeated DONE preserving the saved instant,
entering DONE creating a completion value, reopening clearing it and omitted
status leaving completion fields out of the payload. Review also checks that
the existing persistence and audit sequence remains intact. The final captured
test file and log establish which concrete variants executed; proposed
exercises are not added to the passing-case total.

No real database, generated Prisma client, class-validator pipeline or full
platform build is claimed by this focused check. Concurrent read/write races,
atomic task-and-audit persistence and legacy timestamp repair remain separate
questions. The platform role guard is inspected for context but is not tested
by these service doubles.

Before extending this work, run a real application PATCH against a prepared
database row with a known historical completion time and inspect the persisted
value after a repeat save. Then coordinate competing writers if you intend
to claim concurrency protection. Mechanical baseline, snapshot and link checks
support delivery integrity, while source reasoning and executed behavior
support the bounded fix. Keep those evidence types distinct in your own
engineering report so that the next reviewer knows precisely what to trust.

## Astra execution evidence

The captured focused production-source suite executed 3 tests: all passed, zero failed and zero skipped. Read the [captured output](evidence/crud-b02-runtime2.log) and [exact command and limits](evidence/results.json). Earlier check records remain preserved in the workspace.
