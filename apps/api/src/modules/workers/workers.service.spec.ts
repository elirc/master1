import { WorkersService } from "./workers.service";

const context = {
  actorId: "admin-1",
  ipAddress: "127.0.0.1",
  userAgent: "jest"
};

describe("WorkersService", () => {
  it("applies organization scope and normalized search filters when listing workers", async () => {
    const prisma = {
      worker: {
        findMany: jest.fn().mockResolvedValue([])
      }
    };
    const service = new WorkersService(prisma as any, {} as any);

    await service.list("org-1", "  Ada   Lovelace  ");

    expect(prisma.worker.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        OR: [
          { legalName: { contains: "Ada Lovelace", mode: "insensitive" } },
          { email: { contains: "Ada Lovelace", mode: "insensitive" } },
          { countryCode: { contains: "Ada Lovelace", mode: "insensitive" } }
        ]
      },
      include: expect.objectContaining({
        profile: true,
        documents: true,
        employment: true,
        hireRequest: true
      }),
      orderBy: { createdAt: "desc" }
    });
  });

  it("returns CSV preview validation errors without creating hire requests", async () => {
    const prisma = {
      organization: {
        findUniqueOrThrow: jest.fn()
      },
      hireRequest: {
        create: jest.fn()
      },
      $transaction: jest.fn()
    };
    const service = new WorkersService(prisma as any, {} as any);

    const result = await service.importCsv(context, {
      organizationId: "org-1",
      commit: false,
      csv: "workerLegalName,workerEmail\nAda Lovelace,ada@example.com"
    });

    expect(result.commit).toBe(false);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ row: 2, message: expect.stringContaining("Missing required fields") })
      ])
    );
    expect(prisma.organization.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(prisma.hireRequest.create).not.toHaveBeenCalled();
  });

  it("commits valid CSV rows as hire requests and records an audit entry", async () => {
    const audit = {
      log: jest.fn().mockResolvedValue({ id: "audit-1" })
    };
    const prisma = {
      organization: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: "org-1",
          name: "Acme",
          billingCurrency: "USD"
        })
      },
      hireRequest: {
        create: jest.fn(({ data }) => Promise.resolve({ id: `hire-${data.workerEmail}`, ...data }))
      },
      $transaction: jest.fn((items) => Promise.all(items))
    };
    const service = new WorkersService(prisma as any, audit as any);

    const result = await service.importCsv(context, {
      organizationId: "org-1",
      commit: true,
      csv:
        "workerLegalName,workerEmail,countryCode,jobTitle,startDate,salaryAmountMinor,workLocation\n" +
        "Ada Lovelace,ada@example.com,GB,Engineer,2026-07-01,12000000,London"
    });

    expect(result.commit).toBe(true);
    expect(result.created).toHaveLength(1);
    expect(prisma.hireRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        workerLegalName: "Ada Lovelace",
        workerEmail: "ada@example.com",
        countryCode: "GB",
        jobTitle: "Engineer",
        salaryAmountMinor: 12000000,
        currency: "USD",
        workLocation: "London",
        status: "DRAFT"
      })
    });
    expect(audit.log).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        organizationId: "org-1",
        action: "workers.imported",
        after: { created: 1 }
      })
    );
  });
});
