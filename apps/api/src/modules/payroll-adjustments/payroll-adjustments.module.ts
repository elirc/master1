import { Module } from "@nestjs/common";
import { PayrollModule } from "../payroll/payroll.module";
import { PayrollAdjustmentsController } from "./payroll-adjustments.controller";
import { PayrollAdjustmentsService } from "./payroll-adjustments.service";

@Module({
  imports: [PayrollModule],
  controllers: [PayrollAdjustmentsController],
  providers: [PayrollAdjustmentsService]
})
export class PayrollAdjustmentsModule {}
