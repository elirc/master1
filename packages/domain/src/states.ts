export const hireRequestTransitions = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["INTERNAL_REVIEW", "NEEDS_CLIENT_CHANGES", "CANCELLED"],
  INTERNAL_REVIEW: ["NEEDS_CLIENT_CHANGES", "READY_FOR_WORKER", "CANCELLED"],
  NEEDS_CLIENT_CHANGES: ["SUBMITTED", "CANCELLED"],
  READY_FOR_WORKER: ["WORKER_ONBOARDING", "CANCELLED"],
  WORKER_ONBOARDING: ["CONTRACT_PENDING", "CANCELLED"],
  CONTRACT_PENDING: ["READY_TO_START", "CANCELLED"],
  READY_TO_START: ["ACTIVE", "CANCELLED"],
  ACTIVE: [],
  CANCELLED: []
} as const;

export type HireRequestStatus = keyof typeof hireRequestTransitions;

export const payrollCycleTransitions = {
  OPEN: ["COLLECTING_INPUTS"],
  COLLECTING_INPUTS: ["INTERNAL_REVIEW"],
  INTERNAL_REVIEW: ["CLIENT_REVIEW"],
  CLIENT_REVIEW: ["APPROVED"],
  APPROVED: ["LOCKED"],
  LOCKED: ["PROCESSED"],
  PROCESSED: ["CLOSED"],
  CLOSED: []
} as const;

export type PayrollCycleStatus = keyof typeof payrollCycleTransitions;

export function isPayrollCycleEditable(status: PayrollCycleStatus): boolean {
  return !["LOCKED", "PROCESSED", "CLOSED"].includes(status);
}

export const timeOffTransitions = {
  REQUESTED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: []
} as const;

export type TimeOffStatus = keyof typeof timeOffTransitions;

export const expenseTransitions = {
  SUBMITTED: ["APPROVED_FOR_PAYROLL", "REJECTED"],
  APPROVED_FOR_PAYROLL: ["REIMBURSED"],
  REJECTED: [],
  REIMBURSED: []
} as const;

export type ExpenseStatus = keyof typeof expenseTransitions;

export function assertTransition<TStatus extends string>(
  transitions: Record<TStatus, readonly TStatus[]>,
  from: TStatus,
  to: TStatus
): void {
  if (!transitions[from]?.includes(to)) {
    throw new Error(`Invalid status transition from ${from} to ${to}.`);
  }
}
