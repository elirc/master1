import { Type } from "class-transformer";
import { IsDate, IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateTimeOffRequestDto {
  @IsIn(["VACATION", "SICK", "PUBLIC_HOLIDAY", "UNPAID", "PARENTAL"])
  type!: "VACATION" | "SICK" | "PUBLIC_HOLIDAY" | "UNPAID" | "PARENTAL";

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @IsNumber()
  @Min(0.5)
  days!: number;

  @IsString()
  @IsOptional()
  note?: string;
}
