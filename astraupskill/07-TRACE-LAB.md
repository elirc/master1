# Trace state, event time and audit separately

Let the original completion time be **T1** and the clock during the save be
**T2**. Keep the symbols distinct even if a manual run would produce nearby
timestamps; the point is the difference between completion history and the
moment another save executes.

Fill the last two columns by hand from `tasks.service.ts:51-80` before
checking against the answers below the table.

| # | Before | Request body | `completedAt` in `data` | Audit row? |
| --- | --- | --- | --- | --- |
| a | OPEN, null | `{status:"DONE"}` | | |
| b | DONE, T1 | `{status:"DONE"}` | | |
| c | DONE, T1 | `{status:"OPEN"}` | | |
| d | DONE, T1 | `{priority:"HIGH"}` | | |
| e | DONE, null | `{status:"DONE"}` | | |
| f | DONE, T1 | `{status:null}` | | |
| g | DONE, T1 | `{}` | | |

Answers: a T2; b T1; c null; d absent; e null (legacy value kept); f absent
(falsy status skips the branch); g absent. Every row writes exactly one audit
row, because lines 70-77 run unconditionally after the update.

## Trace 1: the bug

Trace row **b** through the [original snapshot](snapshots/tasks.service.ts.original.txt)
line 56. The condition looks only at `dto.status === "DONE"`, so `new Date()`
(T2) replaces T1. Now trace the current lines 56-63: the inner
`before.status === "DONE"` selects `before.completedAt`. The number of reads
(one, line 52) and writes (one, line 53, plus the audit insert) is the same in
both versions.

## Trace 2: the omitted field

Trace row **d**. The status spread contributes `{}`; only line 64 adds a key.
Follow the returned row into `audit.log`: `before` and `after` both carry
status DONE and the two priorities. The audit row exists even though the
completion fields were untouched. Timestamp stability does not imply "no side
effects".

## Trace 3: two writers

Draw two lanes. Writer A runs line 52 and reads OPEN, then is paused. Writer B
runs the whole method with `{status:"DONE"}` and commits T1. A resumes at line
53 with its stale `before`, takes the "entering DONE" path, and writes T2.
Mark the gap between lines 52 and 53 on your diagram: that is the window, and
nothing in the current code closes it. [05-PRACTICE](05-PRACTICE.md) exercise
4 reproduces this interleaving with a gated Prisma double; 06 answer 4 sketches
a conditional write that would detect it.

Finish by explaining each row aloud without saying "sets the date correctly".
Name the transition, whether the key is present, and the value chosen. That
turns a vague review comment into a claim someone else can test.
