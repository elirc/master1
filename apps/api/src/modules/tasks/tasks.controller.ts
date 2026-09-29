import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { contextFromRequest } from "../../common/request-context";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { RequirePlatformRoles } from "../auth/roles.decorators";
import { PlatformRoleGuard } from "../auth/roles.guard";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TasksService } from "./tasks.service";

@Controller("tasks")
@UseGuards(AuthGuard, PlatformRoleGuard)
@RequirePlatformRoles("PLATFORM_ADMIN", "SUPPORT_AGENT", "ONBOARDING_SPECIALIST", "PAYROLL_SPECIALIST")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@Query("organizationId") organizationId?: string, @Query("status") status?: string) {
    return this.tasks.list(organizationId, status);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateTaskDto) {
    return this.tasks.create(contextFromRequest(request), dto);
  }

  @Patch(":id")
  update(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(contextFromRequest(request), id, dto);
  }
}
