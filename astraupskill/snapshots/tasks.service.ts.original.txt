import { Injectable } from "@nestjs/common";
import type { RequestContext } from "../../common/request-context";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list(organizationId?: string, status?: string) {
    return this.prisma.task.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        ...(status ? { status: status as never } : {})
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      include: { assignee: true, organization: true }
    });
  }

  async create(context: RequestContext, dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        organizationId: dto.organizationId ?? null,
        assigneeId: dto.assigneeId ?? null,
        entityType: dto.entityType ?? null,
        entityId: dto.entityId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        priority: dto.priority,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null
      }
    });

    await this.audit.log({
      context: { ...context, ...(task.organizationId ? { organizationId: task.organizationId } : {}) },
      action: "task.created",
      entityType: "Task",
      entityId: task.id,
      after: { title: task.title, priority: task.priority, dueAt: task.dueAt?.toISOString() }
    });

    return task;
  }

  async update(context: RequestContext, id: string, dto: UpdateTaskDto) {
    const before = await this.prisma.task.findUniqueOrThrow({ where: { id } });
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status, completedAt: dto.status === "DONE" ? new Date() : null } : {}),
        ...(dto.priority ? { priority: dto.priority } : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId || null } : {}),
        ...(dto.dueAt !== undefined ? { dueAt: dto.dueAt ? new Date(dto.dueAt) : null } : {})
      }
    });

    await this.audit.log({
      context: { ...context, ...(task.organizationId ? { organizationId: task.organizationId } : {}) },
      action: "task.updated",
      entityType: "Task",
      entityId: task.id,
      before: { status: before.status, priority: before.priority },
      after: { status: task.status, priority: task.priority }
    });

    return task;
  }
}
