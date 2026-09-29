# State equality is different from an event

An enum value describes current state. A timestamp such as completedAt
describes an event in the resource's history. Assigning status DONE does not
necessarily mean a completion event just occurred: the task may already have
been done when the user opened the form. This distinction matters whenever
an edit screen submits all displayed fields, including values the user did
not change.

Consider a task completed Monday morning. On Tuesday someone changes its
priority and the form also sends DONE. The old service replaces Monday's
completion time with Tuesday's save time. No task work was completed on
Tuesday, yet reports using completedAt could now tell that story. The repaired
branch looks at both the before state and requested state, preserving the
existing value when both are DONE.

Entering DONE from another supported state is different. That is the point
where this service should create a new completion timestamp. Leaving DONE
clears the value under the existing product convention. Omitting status is
different again: this partial request does not express a status operation,
so it should not include status or completedAt in the update payload.

This behavior is a narrow form of repeat stability. Repeating DONE no longer
changes completedAt. It does not make the entire request idempotent in every
observable way: audit events still occur, and database-maintained edit times
may change. Be precise about which state is stable rather than labeling the
whole API idempotent from one assertion.

There is also a data-quality question. If an already DONE row contains a null
completion time, preserving it does not invent a historical timestamp. Repairing
such rows would require a separate policy and evidence. Similarly, the current
read-then-update sequence can race with another writer. A timestamp decision
based on stale before state is a concurrency problem distinct from this
sequential repeat-save defect. Naming those limits helps you propose focused
follow-ups instead of expanding one small fix into an unreviewable rewrite.
