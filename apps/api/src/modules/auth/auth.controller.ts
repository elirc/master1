import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { RequirePlatformRoles } from "./roles.decorators";
import { PlatformRoleGuard } from "./roles.guard";
import { AuthGuard } from "./auth.guard";
import type { AuthenticatedRequest } from "./auth.types";
import { AuthService } from "./auth.service";
import { ImpersonateUserDto } from "./dto/impersonate-user.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.auth;
  }

  @Post("impersonate")
  @UseGuards(AuthGuard, PlatformRoleGuard)
  @RequirePlatformRoles("PLATFORM_ADMIN")
  impersonate(@Req() request: AuthenticatedRequest, @Body() dto: ImpersonateUserDto) {
    return this.auth.impersonate(request.auth?.userId, dto);
  }
}
