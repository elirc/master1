# 20 - Testcontainers Helper

Source: `packages/test-utils/src/postgres-test-database.ts`

## Why This File Matters

Integration tests against real infrastructure catch bugs that mocks miss. This helper starts a real PostgreSQL container for future tests. It is not heavily used yet, but it lays the foundation for serious service-level testing.

## Line-By-Line Reading Notes

Line 1 imports `PostgreSqlContainer` and its started-container type from Testcontainers.

Lines 3-7 define `StartedTestDatabase`. This is the object tests receive after starting Postgres.

Line 4 exposes the container in case a test needs lower-level controls.

Line 5 exposes a database URL that Prisma can use.

Line 6 exposes a `stop()` function that hides Testcontainers-specific return details.

Lines 9-22 define `startPostgresTestDatabase()`.

Lines 10-14 construct a PostgreSQL 16 container with database name, username, and password.

Line 15 starts the container. This pulls/runs Docker infrastructure at test time.

Lines 17-21 return the wrapper object.

Line 19 uses `container.getConnectionUri()` to produce a connection string.

Lines 20-22 define `stop()` as an async function that awaits container shutdown but returns void.

## Codebase Connections

- Future API integration tests can call this helper, run Prisma migrations, and test services against real Postgres.
- Docker Desktop must be running for Testcontainers-based tests.
- This package is intentionally separate so all apps can share integration-test helpers.

## Senior-Level Questions

- Should tests run migrations automatically after starting the database?
- Should each test file get a fresh database or share one per suite?
- How do you keep integration tests fast while still realistic?
