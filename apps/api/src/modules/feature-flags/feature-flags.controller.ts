import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequirePlatformRoles } from "../auth/roles.decorators";
import { PlatformRoleGuard } from "../auth/roles.guard";
import { UpsertFeatureFlagDto } from "./dto/upsert-feature-flag.dto";
import { FeatureFlagsService } from "./feature-flags.service";

@Controller("feature-flags")
@UseGuards(AuthGuard, PlatformRoleGuard)
@RequirePlatformRoles("PLATFORM_ADMIN")
export class FeatureFlagsController {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  @Get()
  list(@Query("organizationId") organizationId?: string) {
    return this.featureFlags.list(organizationId);
  }

  @Post()
  upsert(@Req() request: AuthenticatedRequest, @Body() dto: UpsertFeatureFlagDto) {
    return this.featureFlags.upsert(contextFromRequest(request), dto);
  }
}
