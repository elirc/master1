# GlobalWork EOR Platform

GlobalWork is a fictional Employer of Record SaaS platform built as a TypeScript modular monolith. It is designed as a living software project for practicing real-world engineering: domain modeling, tenant isolation, workflow state, auditability, background jobs, testing, and maintainable architecture.

## Stack

- Next.js and React for the web app
- NestJS for the API
- PostgreSQL and Prisma for persistence
- Redis and BullMQ for background jobs
- Docker Compose for local infrastructure
- Playwright, Vitest/Jest, and Testcontainers for testing
- OpenTelemetry-ready structure for observability

## Local Setup

Corepack can run pnpm even when a global `pnpm` shim is unavailable:

```powershell
corepack pnpm install
Copy-Item .env.example .env
docker compose up -d
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

The web app runs on `http://localhost:3000`.
The API runs on `http://localhost:4000/api`.
Mailpit runs on `http://localhost:8025`.
MinIO console runs on `http://localhost:9001`.

## Architecture Journal

Start with [docs/ARCHITECTURE_JOURNAL.md](docs/ARCHITECTURE_JOURNAL.md). It explains the project structure, how the modules connect, and why the codebase is shaped this way.

For a deeper file-by-file learning path, read [docs/code-walkthroughs/README.md](docs/code-walkthroughs/README.md). It annotates the highest-value source files and explains how to trace workflows through the codebase.

For the forward-looking architecture plan behind the new feature work, read [docs/SYSTEM_DESIGN_FORWARD_PLAN.md](docs/SYSTEM_DESIGN_FORWARD_PLAN.md).

Feature implementation plans and journals live in `docs/features/`.
