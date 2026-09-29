import { IsDateString, IsInt, IsOptional, IsPositive, IsString } from "class-validator";

export class RecordInvoicePaymentDto {
  @IsInt()
  @IsPositive()
  amountMinor!: number;

  @IsString()
  currency!: string;

  @IsString()
  reference!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  receivedAt!: string;
}
