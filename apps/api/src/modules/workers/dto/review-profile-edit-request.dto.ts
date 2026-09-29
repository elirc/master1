import { IsIn, IsOptional, IsString } from "class-validator";

export class ReviewProfileEditRequestDto {
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @IsOptional()
  @IsString()
  decisionReason?: string;
}
