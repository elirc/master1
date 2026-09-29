import { IsIn, IsOptional, IsString } from "class-validator";

export class ReviewApprovalStepDto {
  @IsIn(["APPROVED", "REJECTED", "SKIPPED"])
  status!: "APPROVED" | "REJECTED" | "SKIPPED";

  @IsOptional()
  @IsString()
  decisionReason?: string;
}
