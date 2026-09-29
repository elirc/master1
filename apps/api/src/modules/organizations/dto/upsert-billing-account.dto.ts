import { IsBoolean, IsEmail, IsInt, IsOptional, IsPositive, IsString } from "class-validator";

export class UpsertBillingAccountDto {
  @IsOptional()
  @IsString()
  billingContactName?: string;

  @IsOptional()
  @IsEmail()
  billingContactEmail?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsInt()
  @IsPositive()
  paymentTermsDays!: number;

  @IsString()
  invoiceCurrency!: string;

  @IsBoolean()
  purchaseOrderRequired!: boolean;

  @IsOptional()
  @IsString()
  purchaseOrderNumber?: string;
}
