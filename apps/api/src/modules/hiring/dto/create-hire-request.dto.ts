import { Type } from "class-transformer";
import { IsDate, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateHireRequestDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  workerLegalName!: string;

  @IsEmail()
  workerEmail!: string;

  @IsIn(["US", "CA", "GB"])
  countryCode!: string;

  @IsString()
  @IsNotEmpty()
  jobTitle!: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  managerName?: string;

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @IsInt()
  @Min(1)
  salaryAmountMinor!: number;

  @IsIn(["USD", "CAD", "GBP"])
  salaryCurrency!: string;

  @IsString()
  @IsNotEmpty()
  workLocation!: string;
}
