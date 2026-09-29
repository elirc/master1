import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpsertFeatureFlagDto {
  @IsString()
  @MaxLength(80)
  key!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;
}
