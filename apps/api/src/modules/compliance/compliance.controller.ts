import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequirePlatformRoles } from "../auth/roles.decorators";
import { PlatformRoleGuard } from "../auth/roles.guard";
import { ComplianceService } from "./compliance.service";
import { UpsertComplianceRuleDto } from "./dto/upsert-compliance-rule.dto";

@Controller()
@UseGuards(AuthGuard, PlatformRoleGuard)
@RequirePlatformRoles("PLATFORM_ADMIN", "COMPLIANCE_REVIEWER")
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get("compliance-rules")
  list(@Query("countryCode") countryCode?: string, @Query("organizationId") organizationId?: string) {
    return this.compliance.list(countryCode, organizationId);
  }

  @Post("compliance-rules")
  upsert(@Req() request: AuthenticatedRequest, @Body() dto: UpsertComplianceRuleDto) {
    return this.compliance.upsert(contextFromRequest(request), dto);
  }

  @Get("workers/:workerId/compliance-evaluation")
  evaluateWorker(@Param("workerId") workerId: string) {
    return this.compliance.evaluateWorker(workerId);
  }
}
