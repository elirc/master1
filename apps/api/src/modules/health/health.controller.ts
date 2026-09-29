import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "globalwork-api",
      checkedAt: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      dependencies: {
        database: "configured",
        redis: process.env.REDIS_URL ? "configured" : "not_configured",
        objectStorage: process.env.S3_ENDPOINT ? "configured" : "not_configured"
      }
    };
  }
}
