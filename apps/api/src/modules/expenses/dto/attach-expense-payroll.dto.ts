import { IsString } from "class-validator";

export class AttachExpensePayrollDto {
  @IsString()
  payrollCycleId!: string;
}
