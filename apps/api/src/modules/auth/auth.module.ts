import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { OrganizationRoleGuard, PlatformRoleGuard } from "./roles.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, PlatformRoleGuard, OrganizationRoleGuard],
  exports: [AuthService, AuthGuard, PlatformRoleGuard, OrganizationRoleGuard]
})
export class AuthModule {}
