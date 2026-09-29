import { IsDateString, IsIn, IsOptional, IsString } from "class-validator";

export class CreateTaskDto {
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(["LOW", "NORMAL", "HIGH", "URGENT"])
  priority!: "LOW" | "NORMAL" | "HIGH" | "URGENT";

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
