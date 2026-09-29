import { IsArray, IsString } from "class-validator";

export class CreateApprovalWorkflowDto {
  @IsString()
  organizationId!: string;

  @IsString()
  entityType!: string;

  @IsString()
  name!: string;

  @IsArray()
  requiredRoles!: string[];
}
