import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:4000/api"),
  JWT_SECRET: z.string().min(12).default("development-secret"),
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().default("minioadmin"),
  S3_SECRET_ACCESS_KEY: z.string().default("minioadmin"),
  S3_BUCKET: z.string().default("globalwork-documents"),
  MAIL_FROM: z.string().email().default("no-reply@globalwork.local"),
  MAIL_SMTP_HOST: z.string().default("localhost"),
  MAIL_SMTP_PORT: z.coerce.number().int().positive().default(1025)
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(env);
}
