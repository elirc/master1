# Trace state, event time and audit separately

Let the original completion time be T1 and the current clock be T2. Keep
those symbols distinct even if a quick manual run would produce nearby
timestamps. The purpose of the lab is to expose the semantic difference
between completion history and the moment another save request executes.

| Before | Requested status | completedAt in update | Meaning |
| --- | --- | --- | --- |
| OPEN, no completion | DONE | T2 | Enter completed state |
| DONE, completion T1 | DONE | T1 | Preserve existing history |
| DONE, completion T1 | OPEN | null | Reopen the task |
| DONE, completion T1 | omitted | absent | No status operation |
| DONE, completion null | DONE | null | Preserve legacy value |

First trace the second row in the original snapshot. The requested value
selects new Date without considering before.status, so T2 replaces T1. Now
trace the corrected method: the before record selects its existing value
instead. The number of repository reads and writes does not need to change
to repair this sequential decision.

Next trace the omitted-status row while priority changes. The status branch
contributes no fields, so completedAt should not appear in the data object.
Follow the returned updated task into audit logging. The audit still records
before and after status and priority, then the method returns the updated
record. Timestamp stability does not imply that no audit effect occurs.

For the advanced trace, pause writer A after its initial read and allow writer
B to complete the task. Resume A and note that its before record remains
stale. The current patch reasons correctly from the record it read but does
not prevent that interleaving. Mark the gap between read and update on your
diagram and label the additional database evidence needed to close it.

Finish by explaining each row aloud without using the phrase “sets the date
correctly.” Name the state transition, the field presence and the selected
value. That level of specificity turns a vague code review into a falsifiable
claim another engineer can test.
