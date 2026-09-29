import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from "class-validator";

export class UpsertComplianceRuleDto {
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsString()
  countryCode!: string;

  @IsString()
  key!: string;

  @IsString()
  category!: string;

  @IsIn(["INFO", "WARNING", "BLOCKING"])
  severity!: "INFO" | "WARNING" | "BLOCKING";

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsObject()
  config!: Record<string, unknown>;
}
