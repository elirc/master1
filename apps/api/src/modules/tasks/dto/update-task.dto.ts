import { IsDateString, IsIn, IsOptional, IsString } from "class-validator";

export class UpdateTaskDto {
  @IsOptional()
  @IsIn(["OPEN", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"])
  status?: "OPEN" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";

  @IsOptional()
  @IsIn(["LOW", "NORMAL", "HIGH", "URGENT"])
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
