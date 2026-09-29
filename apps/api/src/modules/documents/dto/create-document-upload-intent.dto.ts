import { IsIn, IsMimeType, IsNotEmpty, IsString } from "class-validator";

export class CreateDocumentUploadIntentDto {
  @IsIn(["IDENTITY", "PROOF_OF_ADDRESS", "TAX_FORM", "BANK_DETAILS", "WORK_AUTHORIZATION", "SIGNED_CONTRACT"])
  type!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsMimeType()
  contentType!: string;
}
