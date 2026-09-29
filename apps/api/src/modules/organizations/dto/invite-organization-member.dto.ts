import { IsEmail, IsIn } from "class-validator";

export class InviteOrganizationMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(["CLIENT_OWNER", "CLIENT_HR_ADMIN", "CLIENT_FINANCE", "CLIENT_MANAGER", "WORKER"])
  role!: "CLIENT_OWNER" | "CLIENT_HR_ADMIN" | "CLIENT_FINANCE" | "CLIENT_MANAGER" | "WORKER";
}
