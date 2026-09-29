import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDocumentDto {
  @IsIn(["IDENTITY", "PROOF_OF_ADDRESS", "TAX_FORM", "BANK_DETAILS", "WORK_AUTHORIZATION", "SIGNED_CONTRACT"])
  type!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
