import { Type } from "class-transformer";
import { IsDate, IsIn, IsNotEmpty, IsString } from "class-validator";

export class CreatePayrollCycleDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsIn(["US", "CA", "GB"])
  countryCode!: string;

  @Type(() => Date)
  @IsDate()
  periodStart!: Date;

  @Type(() => Date)
  @IsDate()
  periodEnd!: Date;
}
