import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { HiringController } from "./hiring.controller";
import { HiringService } from "./hiring.service";

@Module({
  imports: [NotificationsModule],
  controllers: [HiringController],
  providers: [HiringService],
  exports: [HiringService]
})
export class HiringModule {}
