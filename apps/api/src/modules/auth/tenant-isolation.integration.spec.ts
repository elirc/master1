import { execFileSync } from "child_process";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { startPostgresTestDatabase, type StartedTestDatabase } from "@globalwork/test-utils";
import type { AuthenticatedPrincipal } from "./auth.types";
import { organizationWhereForPrincipal } from "./tenant-scope";

const runIntegration = process.env.RUN_INTEGRATION_TESTS === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration("tenant isolation integration", () => {
  let database: StartedTestDatabase;
  let prisma: PrismaClient;

  beforeAll(async () => {
    database = await startPostgresTestDatabase();
    execFileSync(
      "corepack",
      ["pnpm", "--filter", "@globalwork/database", "exec", "prisma", "db", "push", "--skip-generate"],
      {
        cwd: resolve(__dirname, "../../../../.."),
        env: {
          ...process.env,
          DATABASE_URL: database.databaseUrl
        },
        stdio: "inherit"
      }
    );

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: database.databaseUrl
        }
      }
    });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await database?.stop();
  });

  it("returns only organizations in the authenticated user's tenant scope", async () => {
    const user = await prisma.user.create({
      data: {
        email: "tenant-user@example.com",
        name: "Tenant User"
      }
    });

    const allowed = await prisma.organization.create({
      data: {
        legalName: "Allowed Org",
        billingEmail: "billing@allowed.example",
        billingCurrency: "USD",
        countryCode: "US",
        members: {
          create: {
            userId: user.id,
            role: "CLIENT_HR_ADMIN"
          }
        }
      }
    });

    await prisma.organization.create({
      data: {
        legalName: "Blocked Org",
        billingEmail: "billing@blocked.example",
        billingCurrency: "USD",
        countryCode: "US"
      }
    });

    const principal: AuthenticatedPrincipal = {
      userId: user.id,
      email: user.email,
      name: user.name,
      platformRole: null,
      memberships: [{ organizationId: allowed.id, role: "CLIENT_HR_ADMIN" }]
    };

    const visibleOrganizations = await prisma.organization.findMany({
      where: organizationWhereForPrincipal(principal),
      orderBy: { legalName: "asc" }
    });

    expect(visibleOrganizations.map((organization) => organization.legalName)).toEqual(["Allowed Org"]);
  });
});
