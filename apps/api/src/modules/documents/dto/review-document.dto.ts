import { IsIn, IsOptional, IsString } from "class-validator";

export class ReviewDocumentDto {
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @IsString()
  @IsOptional()
  reason?: string;
}
