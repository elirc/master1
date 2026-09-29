import { Module } from "@nestjs/common";
import { AuditController } from "./audit.controller";
import { AuditLogViewerService } from "./audit-log-viewer.service";

@Module({
  controllers: [AuditController],
  providers: [AuditLogViewerService]
})
export class AuditModule {}
