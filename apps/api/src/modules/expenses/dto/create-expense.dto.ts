import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateExpenseDto {
  @IsIn(["TRAVEL", "MEALS", "EQUIPMENT", "INTERNET", "OTHER"])
  category!: "TRAVEL" | "MEALS" | "EQUIPMENT" | "INTERNET" | "OTHER";

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  @Min(1)
  amountMinor!: number;

  @IsIn(["USD", "CAD", "GBP"])
  currency!: string;

  @IsString()
  @IsOptional()
  receiptStorageKey?: string;
}
