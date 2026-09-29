import { IsString } from "class-validator";

export class ImpersonateUserDto {
  @IsString()
  targetUserId!: string;

  @IsString()
  reason!: string;
}
