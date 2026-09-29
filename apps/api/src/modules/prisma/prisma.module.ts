import { Global, Module } from "@nestjs/common";
import { AuditService } from "./services/audit.service";
import { PrismaService } from "./services/prisma.service";

@Global()
@Module({
  providers: [PrismaService, AuditService],
  exports: [PrismaService, AuditService]
})
export class PrismaModule {}
