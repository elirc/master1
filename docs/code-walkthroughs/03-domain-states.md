# 03 - Domain States

Source: `packages/domain/src/states.ts`

## Why This File Matters

This file is a tiny but important example of domain modeling. Instead of allowing any code to set any status string, the app defines allowed transitions in one place.

## Line-By-Line Reading Notes

Lines 1-11 define `hireRequestTransitions`. This object is a state machine. Each key is the current state and each array lists allowed next states.

Line 2 says a `DRAFT` hire can become `SUBMITTED` or `CANCELLED`.

Lines 3-8 represent the middle of the workflow: submitted requests enter internal review, can need client changes, can become ready for worker onboarding, and so on.

Lines 9-10 make `ACTIVE` and `CANCELLED` terminal states. Their arrays are empty, meaning no next states are allowed from them.

Line 11 uses `as const`. This tells TypeScript to preserve exact string literal values instead of widening everything to plain `string`.

Line 13 derives `HireRequestStatus` from the keys of the transition object. This means the type stays synchronized with the object.

Lines 15-25 define `payrollCycleTransitions`. It is a similar state machine for payroll: open, collecting inputs, review, approval, lock, process, close.

Line 27 derives `PayrollCycleStatus`.

Lines 29-38 define `assertTransition()`. This is a reusable guard. It accepts a transition map, a current status, and a desired next status.

Lines 34-36 throw an error when the transition is not allowed. That error becomes a protection against accidental illegal workflow jumps.

## Codebase Connections

- `HiringService.submit()` calls `assertTransition(hireRequestTransitions, before.status, "SUBMITTED")`.
- `PayrollService.advance()` calls `assertTransition(payrollCycleTransitions, before.status, nextStatus)`.
- The tests in `states.test.ts` verify both allowed and rejected transitions.

## Senior-Level Questions

- Should all status updates go through this helper? Ideally yes.
- Should `approveForWorker()` also use the transition helper? Yes, that would be a good follow-up refactor.
- Should invalid transitions throw generic `Error` or domain-specific errors? In a larger system, domain-specific errors can map more cleanly to HTTP responses.
