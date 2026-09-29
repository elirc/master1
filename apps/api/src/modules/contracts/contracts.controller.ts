import { Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequirePlatformRoles } from "../auth/roles.decorators";
import { PlatformRoleGuard } from "../auth/roles.guard";
import { ContractsService } from "./contracts.service";

@Controller()
@UseGuards(AuthGuard, PlatformRoleGuard)
@RequirePlatformRoles("PLATFORM_ADMIN", "ONBOARDING_SPECIALIST", "COMPLIANCE_REVIEWER")
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get("employment-contracts")
  list(@Query("organizationId") organizationId: string) {
    return this.contracts.list(organizationId);
  }

  @Post("workers/:workerId/employment-contracts")
  generate(@Req() request: AuthenticatedRequest, @Param("workerId") workerId: string) {
    return this.contracts.generate(contextFromRequest(request), workerId);
  }
}
