import { IsIn } from "class-validator";

export class UpdateMemberRoleDto {
  @IsIn(["CLIENT_OWNER", "CLIENT_HR_ADMIN", "CLIENT_FINANCE", "CLIENT_MANAGER", "WORKER"])
  role!: "CLIENT_OWNER" | "CLIENT_HR_ADMIN" | "CLIENT_FINANCE" | "CLIENT_MANAGER" | "WORKER";
}
