import { IsBoolean, IsString, MaxLength } from "class-validator";

export class UpsertNotificationPreferenceDto {
  @IsString()
  @MaxLength(80)
  type!: string;

  @IsBoolean()
  emailEnabled!: boolean;
}
