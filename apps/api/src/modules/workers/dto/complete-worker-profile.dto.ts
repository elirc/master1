import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CompleteWorkerProfileDto {
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsString()
  @IsNotEmpty()
  postalCode!: string;

  @IsString()
  @IsNotEmpty()
  taxIdentifier!: string;

  @IsString()
  @IsNotEmpty()
  bankLastFour!: string;
}
