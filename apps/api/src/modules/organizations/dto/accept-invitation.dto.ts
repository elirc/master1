import { IsString, MinLength } from "class-validator";

export class AcceptInvitationDto {
  @IsString()
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
