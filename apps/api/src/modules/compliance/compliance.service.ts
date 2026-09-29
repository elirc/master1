import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { RequestContext } from "../../common/request-context";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { UpsertComplianceRuleDto } from "./dto/upsert-compliance-rule.dto";

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  list(countryCode?: string, organizationId?: string) {
    return this.prisma.complianceRule.findMany({
      where: {
        ...(countryCode ? { countryCode } : {}),
        ...(organizationId ? { OR: [{ organizationId }, { organizationId: null }] } : {})
      },
      orderBy: [{ countryCode: "asc" }, { key: "asc" }]
    });
  }

  async upsert(context: RequestContext, dto: UpsertComplianceRuleDto) {
    const scopeKey = dto.organizationId ? `organization:${dto.organizationId}` : "global";
    const before = await this.prisma.complianceRule.findUnique({
      where: { scopeKey_countryCode_key: { scopeKey, countryCode: dto.countryCode, key: dto.key } }
    });
    const rule = await this.prisma.complianceRule.upsert({
      where: { scopeKey_countryCode_key: { scopeKey, countryCode: dto.countryCode, key: dto.key } },
      update: {
        category: dto.category,
        severity: dto.severity,
        enabled: dto.enabled ?? true,
        config: dto.config as Prisma.InputJsonValue
      },
      create: {
        organizationId: dto.organizationId ?? null,
        scopeKey,
        countryCode: dto.countryCode,
        key: dto.key,
        category: dto.category,
        severity: dto.severity,
        enabled: dto.enabled ?? true,
        config: dto.config as Prisma.InputJsonValue
      }
    });

    await this.audit.log({
      context: { ...context, ...(rule.organizationId ? { organizationId: rule.organizationId } : {}) },
      action: "compliance_rule.upserted",
      entityType: "ComplianceRule",
      entityId: rule.id,
      ...(before ? { before: { severity: before.severity, enabled: before.enabled } } : {}),
      after: { key: rule.key, severity: rule.severity, enabled: rule.enabled }
    });

    return rule;
  }

  async evaluateWorker(workerId: string) {
    const worker = await this.prisma.worker.findUniqueOrThrow({
      where: { id: workerId },
      include: { profile: true, documents: true }
    });
    const rules = await this.list(worker.countryCode, worker.organizationId);
    const findings = rules.filter((rule) => rule.enabled).flatMap((rule) => evaluateRule(rule, worker));

    return {
      workerId,
      countryCode: worker.countryCode,
      passed: findings.every((finding) => finding.severity !== "BLOCKING"),
      findings
    };
  }
}

function evaluateRule(
  rule: { key: string; severity: string; config: Prisma.JsonValue },
  worker: { profile: unknown; documents: Array<{ type: string; status: string }> }
) {
  if (rule.key === "profile_required" && !worker.profile) {
    return [{ ruleKey: rule.key, severity: rule.severity, message: "Worker profile is missing." }];
  }

  if (rule.key === "approved_documents_required") {
    const config = rule.config && typeof rule.config === "object" && !Array.isArray(rule.config) ? rule.config : {};
    const required = Array.isArray(config.types) ? config.types.filter((item): item is string => typeof item === "string") : [];
    const approved = new Set(worker.documents.filter((document) => document.status === "APPROVED").map((document) => document.type));
    return required
      .filter((type) => !approved.has(type))
      .map((type) => ({ ruleKey: rule.key, severity: rule.severity, message: `Missing approved document: ${type}.` }));
  }

  return [];
}
