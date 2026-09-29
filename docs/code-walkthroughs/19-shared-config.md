# 19 - Shared Config

Source: `packages/config/src/index.ts`

## Why This File Matters

Configuration bugs are common in real systems. This file uses Zod to validate environment variables at runtime, which catches missing or malformed config early.

## Line-By-Line Reading Notes

Line 1 imports Zod.

Lines 3-14 define `envSchema`. This is the runtime contract for environment variables.

Line 4 requires `DATABASE_URL` to be a URL.

Line 5 defines `REDIS_URL` with a default.

Line 6 defines `API_PORT` as a positive integer, coercing from string because environment variables are strings.

Line 7 defines the public API base URL used by the frontend.

Line 8 defines `JWT_SECRET`. This is not fully used yet, but it marks where auth configuration will grow.

Lines 9-11 define local mail configuration.

Line 14 closes the schema.

Line 16 exports `AppConfig`, a TypeScript type inferred from the Zod schema. This avoids writing the same shape twice.

Lines 18-20 define `loadConfig()`. It parses `process.env` by default, but tests can pass a custom environment object.

## Codebase Connections

- `apps/worker/src/index.ts` calls `loadConfig()`.
- Future API bootstrap should call `loadConfig()` instead of reading `process.env` directly.
- `.env.example` should stay synchronized with this schema.

## Senior-Level Questions

- Should every runtime app load config through this package?
- Should secrets be allowed to have development defaults?
- Should config parsing happen once at startup and then be injected?
