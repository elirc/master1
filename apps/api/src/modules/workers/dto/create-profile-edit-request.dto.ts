import { IsObject } from "class-validator";

export class CreateProfileEditRequestDto {
  @IsObject()
  proposedChanges!: Record<string, unknown>;
}
