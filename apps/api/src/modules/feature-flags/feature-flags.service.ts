import { BadRequestException, Injectable } from "@nestjs/common";
import type { RequestContext } from "../../common/request-context";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { UpsertFeatureFlagDto } from "./dto/upsert-feature-flag.dto";

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list(organizationId?: string) {
    return this.prisma.featureFlag.findMany({
      where: organizationId ? { OR: [{ organizationId }, { organizationId: null }] } : {},
      orderBy: [{ organizationId: "asc" }, { key: "asc" }],
      include: { organization: true }
    });
  }

  async upsert(context: RequestContext, dto: UpsertFeatureFlagDto) {
    const key = normalizeFlagKey(dto.key);
    if (!key) {
      throw new BadRequestException("Feature flag key is required.");
    }

    if (dto.organizationId) {
      await this.prisma.organization.findUniqueOrThrow({ where: { id: dto.organizationId } });
    }

    const before = await this.prisma.featureFlag.findUnique({
      where: {
        scopeKey_key: {
          scopeKey: flagScopeKey(dto.organizationId),
          key
        }
      }
    });

    const flag = await this.prisma.featureFlag.upsert({
      where: {
        scopeKey_key: {
          scopeKey: flagScopeKey(dto.organizationId),
          key
        }
      },
      update: {
        enabled: dto.enabled,
        description: dto.description ?? null
      },
      create: {
        organizationId: dto.organizationId ?? null,
        scopeKey: flagScopeKey(dto.organizationId),
        key,
        enabled: dto.enabled,
        description: dto.description ?? null
      }
    });

    await this.audit.log({
      context: { ...context, ...(flag.organizationId ? { organizationId: flag.organizationId } : {}) },
      action: "feature_flag.upserted",
      entityType: "FeatureFlag",
      entityId: flag.id,
      ...(before ? { before: { enabled: before.enabled, description: before.description } } : {}),
      after: { key: flag.key, enabled: flag.enabled, organizationId: flag.organizationId }
    });

    return flag;
  }

  async isEnabled(key: string, organizationId?: string) {
    const normalized = normalizeFlagKey(key);
    const flag = await this.prisma.featureFlag.findFirst({
      where: {
        key: normalized,
        OR: [{ organizationId: organizationId ?? null }, { organizationId: null }]
      },
      orderBy: { organizationId: "desc" }
    });

    return flag?.enabled ?? false;
  }
}

function normalizeFlagKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function flagScopeKey(organizationId?: string): string {
  return organizationId ? `organization:${organizationId}` : "global";
}
