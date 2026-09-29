import { Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import type { OutboxEventStatus } from "@prisma/client";
import { AuthGuard } from "../auth/auth.guard";
import { RequirePlatformRoles } from "../auth/roles.decorators";
import { PlatformRoleGuard } from "../auth/roles.guard";
import { OutboxService } from "./outbox.service";

@Controller("outbox-events")
@UseGuards(AuthGuard, PlatformRoleGuard)
@RequirePlatformRoles("PLATFORM_ADMIN")
export class OutboxController {
  constructor(private readonly outbox: OutboxService) {}

  @Get()
  list(@Query("status") status?: OutboxEventStatus) {
    return this.outbox.list(status);
  }

  @Patch(":id/retry")
  retry(@Param("id") id: string) {
    return this.outbox.retry(id);
  }
}
