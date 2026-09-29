# Use the before state already in hand

Open the original service snapshot and find the data object passed to
prisma.task.update. Before this repair, the status branch used the requested
value alone: DONE selected new Date, and another supplied status selected
null. That correctly handled first completion and reopening, but it could
not distinguish a repeat DONE save from a new completion.

The method already reads the task into before. The repaired expression uses
that record when dto.status is DONE. If before.status is also DONE, assign
before.completedAt. Otherwise assign a new Date. For another supplied status,
retain the existing null behavior. Keep the outer optional-status branch so
ordinary priority, assignee or due-date edits do not add completion fields.

Work through a concrete example with a saved timestamp of January 2 at 03:04.
Supply status DONE again and inspect the update arguments. The timestamp
should be the original value, even though execution happens much later.
Then supply OPEN: the generated payload should clear completedAt. Finally
omit status and change priority: the payload should contain the requested
priority without either status or completedAt.

The fix changes neither the task identifier predicate nor the audit sequence.
The returned value continues to be the updated task from Prisma. These
neighboring contracts matter because a timestamp repair should not accidentally
return the stale before record, add extra reads or skip existing audit behavior.
Tests record those effects where relevant rather than relying only on a
comparison of one local variable.

Review runtime input behavior as well as the typed DTO. Replacing a truthiness
check with a presence-only check can change how null or empty input reaches
persistence, even if those values are absent from the TypeScript union. Avoid
that unrelated change unless its intended contract is established and tested.
The smallest useful patch expresses the transition rule while preserving
the surrounding update semantics. Compare the final diff with the original
snapshot and explain every changed condition in terms of observable behavior.
