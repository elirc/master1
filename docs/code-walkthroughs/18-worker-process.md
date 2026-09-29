# 18 - Worker Process

Source: `apps/worker/src/index.ts`

## Why This File Matters

Not all work should happen during HTTP requests. Background workers handle slow or retryable side effects such as email delivery, payroll generation, imports, exports, and reminders. This file is the first async processing surface.

## Line-By-Line Reading Notes

Lines 1-4 import BullMQ, Redis, Prisma, and shared config.

Line 6 loads environment configuration.

Line 7 creates a Prisma client for the worker process.

Lines 8-10 create a Redis connection. BullMQ uses Redis to coordinate jobs.

Line 12 starts a BullMQ `Worker` for the `email` queue.

Lines 14-32 define the job handler.

Line 15 reads `notificationId` from the job data.

Lines 16-18 reject malformed jobs early.

Lines 20-22 load the notification from the database.

Line 24 logs the email content. This is a placeholder for real SMTP or provider delivery.

Lines 26-32 mark the notification as sent and set `sentAt`.

Line 33 passes the Redis connection into the worker.

Lines 36-38 log completed jobs.

Lines 40-42 log failed jobs.

Lines 44-45 register shutdown handlers for Ctrl+C or process termination.

Lines 47-52 gracefully close the worker, Redis connection, and Prisma connection before exiting.

## Codebase Connections

- `Notification` records are created by services such as `HiringService`.
- Future notification service code should enqueue jobs into the `email` queue.
- Docker Compose provides Redis for BullMQ.

## Senior-Level Questions

- Should failed jobs update notification status to `FAILED`?
- Should job handlers be split into modules instead of living in `index.ts`?
- Should email delivery be idempotent to avoid duplicate sends?
- Should queues have retry and backoff policies?
