import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  legalName!: string;

  @IsString()
  @IsOptional()
  tradeName?: string;

  @IsEmail()
  billingEmail!: string;

  @IsIn(["USD", "CAD", "GBP"])
  billingCurrency!: string;

  @IsIn(["US", "CA", "GB"])
  countryCode!: string;
}
