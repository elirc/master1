import { InvoicesService } from "./invoices.service";

const context = {
  actorId: "user-1",
  ipAddress: "127.0.0.1",
  userAgent: "jest"
};

function createService(invoice: any) {
  const tx = {
    invoicePayment: {
      create: jest.fn().mockResolvedValue({ id: "payment-1", amountMinor: 2500 })
    },
    invoice: {
      update: jest.fn().mockImplementation(async ({ data }) => ({ ...invoice, ...data }))
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "audit-1" })
    }
  };

  const prisma = {
    invoice: {
      findUniqueOrThrow: jest.fn().mockResolvedValue(invoice)
    },
    $transaction: jest.fn((callback) => callback(tx))
  };

  return {
    service: new InvoicesService(prisma as any, {} as any, {} as any),
    prisma,
    tx
  };
}

describe("InvoicesService", () => {
  it("records a partial payment without marking the invoice paid", async () => {
    const invoice = {
      id: "invoice-1",
      organizationId: "org-1",
      status: "ISSUED",
      currency: "USD",
      totalMinor: 10000,
      payments: [{ amountMinor: 2500 }]
    };
    const { service, tx } = createService(invoice);

    const result = await service.recordPayment(context, "invoice-1", {
      amountMinor: 2500,
      currency: "USD",
      reference: "ACH-100",
      receivedAt: "2026-05-05T12:00:00.000Z"
    });

    expect(tx.invoicePayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        invoiceId: "invoice-1",
        amountMinor: 2500,
        currency: "USD",
        reference: "ACH-100"
      })
    });
    expect(tx.invoice.update).toHaveBeenCalledWith({
      where: { id: "invoice-1" },
      data: expect.objectContaining({
        status: "PARTIALLY_PAID",
        paidAt: null
      })
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "invoice.payment_recorded",
        before: { status: "ISSUED", paidMinor: 2500 },
        after: expect.objectContaining({ status: "PARTIALLY_PAID", paidMinor: 5000 })
      })
    });
    expect(result.invoice.status).toBe("PARTIALLY_PAID");
  });

  it("marks an invoice paid when the payment reaches the invoice total", async () => {
    const receivedAt = "2026-05-05T12:00:00.000Z";
    const invoice = {
      id: "invoice-1",
      organizationId: "org-1",
      status: "PARTIALLY_PAID",
      currency: "USD",
      totalMinor: 10000,
      payments: [{ amountMinor: 7500 }]
    };
    const { service, tx } = createService(invoice);

    const result = await service.recordPayment(context, "invoice-1", {
      amountMinor: 2500,
      currency: "USD",
      receivedAt
    });

    expect(tx.invoice.update).toHaveBeenCalledWith({
      where: { id: "invoice-1" },
      data: expect.objectContaining({
        status: "PAID",
        paidAt: new Date(receivedAt)
      })
    });
    expect(result.invoice.status).toBe("PAID");
  });

  it("rejects overpayments before opening a transaction", async () => {
    const invoice = {
      id: "invoice-1",
      organizationId: "org-1",
      status: "ISSUED",
      currency: "USD",
      totalMinor: 10000,
      payments: [{ amountMinor: 9000 }]
    };
    const { service, prisma } = createService(invoice);

    await expect(
      service.recordPayment(context, "invoice-1", {
        amountMinor: 2000,
        currency: "USD",
        receivedAt: "2026-05-05T12:00:00.000Z"
      })
    ).rejects.toThrow("Payment would overpay the invoice.");

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("requires payment currency to match the invoice currency", async () => {
    const invoice = {
      id: "invoice-1",
      organizationId: "org-1",
      status: "ISSUED",
      currency: "USD",
      totalMinor: 10000,
      payments: []
    };
    const { service, prisma } = createService(invoice);

    await expect(
      service.recordPayment(context, "invoice-1", {
        amountMinor: 2000,
        currency: "EUR",
        receivedAt: "2026-05-05T12:00:00.000Z"
      })
    ).rejects.toThrow("Payment currency must match invoice currency.");

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
