import { IsInt, IsOptional, IsString, Matches, Min } from "class-validator";

export class CompleteDocumentUploadDto {
  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @IsString()
  @IsOptional()
  @Matches(/^[a-f0-9]{64}$/)
  checksumSha256?: string;
}
