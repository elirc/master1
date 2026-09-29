import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { loadConfig } from "@globalwork/config";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

const config = loadConfig();
const prisma = new PrismaClient();
const connection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null
});
const emailQueue = new Queue("email", { connection });
const heartbeatPath = resolve(process.cwd(), "tmp", "worker-heartbeat.json");
const emailJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 3_000
  },
  removeOnComplete: 100,
  removeOnFail: 500
};

writeHeartbeat("started");

const emailWorker = new Worker(
  "email",
  async (job) => {
    const notificationId = job.data.notificationId as string | undefined;
    if (!notificationId) {
      throw new Error("Email job is missing notificationId.");
    }

    const notification = await prisma.notification.findUniqueOrThrow({
      where: { id: notificationId }
    });

    console.log(`[email] ${notification.subject}: ${notification.body}`);

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        sentAt: new Date()
      }
    });
  },
  { connection }
);

const outboxWorker = new Worker(
  "outbox",
  async (job) => {
    const outboxEventId = job.data.outboxEventId as string | undefined;
    if (!outboxEventId) {
      throw new Error("Outbox job is missing outboxEventId.");
    }

    const event = await prisma.outboxEvent.update({
      where: { id: outboxEventId },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 }
      }
    });

    try {
      if (event.type === "notification.email") {
        const payload = event.payload as { notificationId?: string };
        if (!payload.notificationId) {
          throw new Error("notification.email outbox event is missing notificationId.");
        }

        await emailQueue.add("send-notification-email", { notificationId: payload.notificationId }, emailJobOptions);
      }

      await prisma.outboxEvent.update({
        where: { id: outboxEventId },
        data: {
          status: "PROCESSED",
          processedAt: new Date()
        }
      });
    } catch (error) {
      await prisma.outboxEvent.update({
        where: { id: outboxEventId },
        data: {
          status: "FAILED",
          lastError: error instanceof Error ? error.message : "Unknown outbox processing error"
        }
      });
      throw error;
    }
  },
  { connection }
);

emailWorker.on("completed", (job) => {
  console.log(`[worker] email job ${job.id} completed`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`[worker] email job ${job?.id ?? "unknown"} failed`, error);
});

outboxWorker.on("completed", (job) => {
  console.log(`[worker] outbox job ${job.id} completed`);
});

outboxWorker.on("failed", (job, error) => {
  console.error(`[worker] outbox job ${job?.id ?? "unknown"} failed`, error);
});

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

async function shutdown() {
  writeHeartbeat("stopping");
  await emailWorker.close();
  await outboxWorker.close();
  await emailQueue.close();
  await connection.quit();
  await prisma.$disconnect();
  writeHeartbeat("stopped");
  process.exit(0);
}

function writeHeartbeat(status: "started" | "stopping" | "stopped") {
  const heartbeat = {
    service: "globalwork-worker",
    status,
    checkedAt: new Date().toISOString(),
    queues: ["email", "outbox"]
  };

  mkdirSync(dirname(heartbeatPath), { recursive: true });
  writeFileSync(heartbeatPath, `${JSON.stringify(heartbeat, null, 2)}\n`);
  console.log(JSON.stringify({ event: "worker.heartbeat", ...heartbeat }));
}
