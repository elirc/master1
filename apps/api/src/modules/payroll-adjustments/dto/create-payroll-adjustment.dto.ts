import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePayrollAdjustmentDto {
  @IsString()
  @IsOptional()
  payrollCycleId?: string;

  @IsIn(["BONUS", "COMMISSION", "ALLOWANCE", "DEDUCTION"])
  kind!: "BONUS" | "COMMISSION" | "ALLOWANCE" | "DEDUCTION";

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  amountMinor!: number;

  @IsIn(["USD", "CAD", "GBP"])
  currency!: string;
}
