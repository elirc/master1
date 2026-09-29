import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export interface StartedTestDatabase {
  container: StartedPostgreSqlContainer;
  databaseUrl: string;
  stop: () => Promise<void>;
}

export async function startPostgresTestDatabase(): Promise<StartedTestDatabase> {
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("globalwork_test")
    .withUsername("globalwork")
    .withPassword("globalwork")
    .start();

  return {
    container,
    databaseUrl: container.getConnectionUri(),
    stop: async () => {
      await container.stop();
    }
  };
}
