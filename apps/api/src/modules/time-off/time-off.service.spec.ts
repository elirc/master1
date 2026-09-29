import { TimeOffService } from "./time-off.service";

const context = {
  actorId: "manager-1",
  ipAddress: "127.0.0.1",
  userAgent: "jest"
};

function createService(request: any, balance: any) {
  const tx = {
    timeOffRequest: {
      update: jest.fn().mockImplementation(async ({ data }) => ({ ...request, ...data }))
    },
    timeOffBalance: {
      update: jest.fn().mockResolvedValue({ ...balance, usedDays: Number(balance.usedDays) + Number(request.days) })
    }
  };

  const prisma = {
    timeOffRequest: {
      findUniqueOrThrow: jest.fn().mockResolvedValue(request)
    },
    worker: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: request.workerId,
        countryCode: request.worker.countryCode
      })
    },
    countryProfile: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({ annualPtoDays: 20 })
    },
    timeOffBalance: {
      upsert: jest.fn().mockResolvedValue(balance)
    },
    $transaction: jest.fn((callback) => callback(tx))
  };
  const audit = {
    log: jest.fn().mockResolvedValue({ id: "audit-1" })
  };

  return {
    service: new TimeOffService(prisma as any, audit as any),
    prisma,
    tx,
    audit
  };
}

describe("TimeOffService", () => {
  it("approves vacation and increments the yearly vacation balance", async () => {
    const request = {
      id: "time-off-1",
      organizationId: "org-1",
      workerId: "worker-1",
      status: "REQUESTED",
      type: "VACATION",
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      days: 3,
      worker: { countryCode: "US" }
    };
    const balance = {
      workerId: "worker-1",
      year: 2026,
      type: "VACATION",
      allowanceDays: 20,
      usedDays: 5
    };
    const { service, tx, audit } = createService(request, balance);

    const result = await service.review(context, "time-off-1", {
      status: "APPROVED",
      decisionReason: "Coverage is arranged"
    });

    expect(tx.timeOffBalance.update).toHaveBeenCalledWith({
      where: { workerId_year_type: { workerId: "worker-1", year: 2026, type: "VACATION" } },
      data: { usedDays: { increment: 3 } }
    });
    expect(audit.log).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        organizationId: "org-1",
        entityType: "time_off_request",
        entityId: "time-off-1",
        action: "time_off.reviewed",
        before: { status: "REQUESTED" },
        after: { status: "APPROVED" }
      })
    );
    expect(result.status).toBe("APPROVED");
  });

  it("blocks vacation approval when it would exceed the available balance", async () => {
    const request = {
      id: "time-off-1",
      organizationId: "org-1",
      workerId: "worker-1",
      status: "REQUESTED",
      type: "VACATION",
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      days: 3,
      worker: { countryCode: "US" }
    };
    const balance = {
      workerId: "worker-1",
      year: 2026,
      type: "VACATION",
      allowanceDays: 20,
      usedDays: 19
    };
    const { service, prisma, tx } = createService(request, balance);

    await expect(
      service.review(context, "time-off-1", {
        status: "APPROVED"
      })
    ).rejects.toThrow("Approving this request would exceed the worker's vacation balance.");

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.timeOffBalance.update).not.toHaveBeenCalled();
  });
});
