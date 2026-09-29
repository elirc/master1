# Answers: preserve the meaning of each field

For a repeated DONE request, data includes status DONE and the existing
completion timestamp. Reopening with OPEN includes status OPEN and completedAt
null. A priority-only edit includes priority but no completion fields. An
empty update contains no new completion decision. These predictions describe
the service's generated payload; database behavior for an otherwise empty
update belongs to its own integration contract.

The property-existence test is weak because both the original fresh Date and
the correct historical value satisfy it. Use a specific saved timestamp and
assert that exact value reaches the update. A separate transition from OPEN
to DONE should use the controlled current instant. Together they distinguish
preserving an old completion from creating a new one, preventing an overly
broad fix that always preserves null.

Letting the client dictate completedAt would turn a historical server decision
into ordinary editable input. It also fails to establish whether a transition
occurred. Moving the decision into SQL could be reasonable, but requires a
clear mutation expression, returned-row semantics and database-backed tests.
Removing the read without replacing its information is not equivalent behavior.

The entire request should not be called side-effect free on repeats. Its
completion timestamp is stable, while audit logging still records the save.
That may be appropriate when the audit describes user actions. If downstream
billing or notifications must occur once, they need their own idempotency or
deduplication rule; timestamp preservation does not automatically protect them.

In the concurrency example, A's earlier OPEN record leads it to generate a
fresh completion after B has already completed the task. A version-qualified
write could reject A if the task changed since its read. Test that with two
controlled writers and inspect both the final completion time and rejection
behavior. A focused sequential fixture cannot establish that stronger guarantee.

For legacy nulls, the bounded repair preserves the existing value on repeated
DONE. Stamping the current time would invent a completion event. A separate
data repair might recover a trustworthy audit event if one exists, but its
policy must address absent or conflicting history. Good review notes separate
the current request defect, legacy data quality and concurrent writes instead
of pretending one conditional solves all three problems.
