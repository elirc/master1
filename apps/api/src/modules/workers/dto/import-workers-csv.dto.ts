import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ImportWorkersCsvDto {
  @IsString()
  organizationId!: string;

  @IsString()
  csv!: string;

  @IsOptional()
  @IsBoolean()
  commit?: boolean;
}
