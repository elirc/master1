import { IsIn, IsOptional, IsString } from "class-validator";

export class ReviewExpenseDto {
  @IsIn(["APPROVED_FOR_PAYROLL", "REJECTED"])
  status!: "APPROVED_FOR_PAYROLL" | "REJECTED";

  @IsString()
  @IsOptional()
  decisionReason?: string;
}
