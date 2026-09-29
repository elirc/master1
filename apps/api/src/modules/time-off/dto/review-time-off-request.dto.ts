import { IsIn, IsOptional, IsString } from "class-validator";

export class ReviewTimeOffRequestDto {
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @IsString()
  @IsOptional()
  decisionReason?: string;
}
