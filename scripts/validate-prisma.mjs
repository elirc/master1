import { execSync } from "node:child_process";

process.env.DATABASE_URL ??= "postgresql://globalwork:globalwork@localhost:5432/globalwork?schema=public";

execSync("corepack pnpm --filter @globalwork/database exec prisma validate", {
  stdio: "inherit",
  env: process.env
});
