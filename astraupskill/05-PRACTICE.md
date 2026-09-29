# Predict the transition before editing

Exercise one is a payload prediction. Start with a DONE task whose completion
time is a fixed historical instant. Predict data for four requests: DONE
again, OPEN, priority HIGH with status omitted, and an empty update. Identify
which payloads include completedAt and whether the value is preserved, cleared
or absent. Do not collapse absent and null into the same answer.

Exercise two is a regression-design task. A teammate checks that saving DONE
returns an object with a completedAt property. Explain why that test would
not catch the original bug. Replace it with an assertion that distinguishes
the historical instant from the time of this save. Add a first-completion
case that would fail if the implementation always reused before.completedAt.

Exercise three is a review task. Someone proposes removing the initial task
read and always setting completedAt from the request body. Explain the trust
and history problems this creates. If performance motivates the proposal,
describe the repository-level evidence needed before moving the transition
decision into a database expression. Do not assume deleting a read is always
an improvement.

Exercise four asks about repeat behavior. The completion time remains stable
on repeated DONE, but an audit entry is still written. Is the whole request
idempotent? Write a precise answer that names the stable field and the
remaining side effects. Give one example where repeated audit entries might
be acceptable and one where deduplication would require its own contract.

Exercise five explores concurrency. Writer A reads OPEN. Writer B completes
the task and saves. Writer A then sends DONE using its earlier before state.
Draw the sequence and explain why this patch alone does not guarantee the
earliest completion time survives. Propose an optimistic version predicate
or transaction experiment, including the observable failure it should detect.

Finally, consider a legacy row that is DONE with completedAt null. Decide
whether preserving null, stamping now or recovering an audit timestamp is
appropriate for a separate repair. List the evidence your choice requires.
The objective is disciplined reasoning about history, not inventing a date
because a nullable field looks inconvenient.
