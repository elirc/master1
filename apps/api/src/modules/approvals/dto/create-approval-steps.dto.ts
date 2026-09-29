import { IsString } from "class-validator";

export class CreateApprovalStepsDto {
  @IsString()
  workflowId!: string;

  @IsString()
  entityId!: string;
}
