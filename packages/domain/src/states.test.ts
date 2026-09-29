import { describe, expect, it } from "vitest";
import {
  assertTransition,
  expenseTransitions,
  hireRequestTransitions,
  isPayrollCycleEditable,
  timeOffTransitions
} from "./states";

describe("hire request transitions", () => {
  it("allows a draft hire request to be submitted", () => {
    expect(() => assertTransition(hireRequestTransitions, "DRAFT", "SUBMITTED")).not.toThrow();
  });

  it("rejects activating a draft hire directly", () => {
    expect(() => assertTransition(hireRequestTransitions, "DRAFT", "ACTIVE")).toThrow(
      "Invalid status transition"
    );
  });
});

describe("expense transitions", () => {
  it("allows submitted expenses to be approved for payroll", () => {
    expect(() => assertTransition(expenseTransitions, "SUBMITTED", "APPROVED_FOR_PAYROLL")).not.toThrow();
  });

  it("rejects reimbursing a rejected expense", () => {
    expect(() => assertTransition(expenseTransitions, "REJECTED", "REIMBURSED")).toThrow("Invalid status transition");
  });
});

describe("payroll editability", () => {
  it("allows payroll cycles to be edited before locking", () => {
    expect(isPayrollCycleEditable("OPEN")).toBe(true);
    expect(isPayrollCycleEditable("APPROVED")).toBe(true);
  });

  it("blocks payroll edits after locking", () => {
    expect(isPayrollCycleEditable("LOCKED")).toBe(false);
    expect(isPayrollCycleEditable("PROCESSED")).toBe(false);
    expect(isPayrollCycleEditable("CLOSED")).toBe(false);
  });
});

describe("time off transitions", () => {
  it("allows requested leave to be approved", () => {
    expect(() => assertTransition(timeOffTransitions, "REQUESTED", "APPROVED")).not.toThrow();
  });

  it("rejects changing approved leave back to requested", () => {
    expect(() => assertTransition(timeOffTransitions, "APPROVED", "REQUESTED")).toThrow("Invalid status transition");
  });
});
