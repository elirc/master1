import { IsIn } from "class-validator";

export class AdvancePayrollCycleDto {
  @IsIn(["COLLECTING_INPUTS", "INTERNAL_REVIEW", "CLIENT_REVIEW", "APPROVED", "LOCKED", "PROCESSED", "CLOSED"])
  status!: "COLLECTING_INPUTS" | "INTERNAL_REVIEW" | "CLIENT_REVIEW" | "APPROVED" | "LOCKED" | "PROCESSED" | "CLOSED";
}
