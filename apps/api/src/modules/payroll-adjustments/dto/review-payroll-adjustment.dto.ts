import { IsIn, IsOptional, IsString } from "class-validator";

export class ReviewPayrollAdjustmentDto {
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @IsString()
  @IsOptional()
  decisionReason?: string;
}
