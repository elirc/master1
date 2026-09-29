import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { RequestLoggingInterceptor } from "./common/request-logging.interceptor";
import { AuthModule } from "./modules/auth/auth.module";
import { AuditModule } from "./modules/audit/audit.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { CountriesModule } from "./modules/countries/countries.module";
import { ComplianceModule } from "./modules/compliance/compliance.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { DomainEventsModule } from "./modules/events/domain-events.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { FeatureFlagsModule } from "./modules/feature-flags/feature-flags.module";
import { HealthModule } from "./modules/health/health.module";
import { HiringModule } from "./modules/hiring/hiring.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { OutboxModule } from "./modules/outbox/outbox.module";
import { PayrollModule } from "./modules/payroll/payroll.module";
import { PayrollAdjustmentsModule } from "./modules/payroll-adjustments/payroll-adjustments.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { StorageModule } from "./modules/storage/storage.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { TimeOffModule } from "./modules/time-off/time-off.module";
import { WorkersModule } from "./modules/workers/workers.module";

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AuthModule,
    AuditModule,
    ApprovalsModule,
    HealthModule,
    ComplianceModule,
    CountriesModule,
    ContractsModule,
    OrganizationsModule,
    HiringModule,
    WorkersModule,
    DocumentsModule,
    DomainEventsModule,
    ExpensesModule,
    FeatureFlagsModule,
    TimeOffModule,
    PayrollModule,
    PayrollAdjustmentsModule,
    InvoicesModule,
    ReportsModule,
    OutboxModule,
    NotificationsModule,
    TasksModule
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor
    }
  ]
})
export class AppModule {}
