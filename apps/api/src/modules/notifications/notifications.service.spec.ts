const mockQueueAdd = jest.fn();
const mockQueueClose = jest.fn();
const mockRedisQuit = jest.fn();

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    close: mockQueueClose
  }))
}));

jest.mock("ioredis", () => jest.fn().mockImplementation(() => ({ quit: mockRedisQuit })));

import { NotificationsService } from "./notifications.service";

describe("NotificationsService", () => {
  beforeEach(() => {
    mockQueueAdd.mockClear();
    mockQueueClose.mockClear();
    mockRedisQuit.mockClear();
  });

  it("marks notifications failed and skips queueing when email is disabled", async () => {
    const prisma = {
      notificationPreference: {
        findUnique: jest.fn().mockResolvedValue({ userId: "user-1", emailEnabled: false })
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: "notification-1", status: "FAILED" })
      },
      $transaction: jest.fn()
    };
    const domainEvents = {
      record: jest.fn()
    };
    const service = new NotificationsService(prisma as any, domainEvents as any);

    const result = await service.createAndQueue({
      organizationId: "org-1",
      userId: "user-1",
      type: "invoice_issued",
      channel: "EMAIL",
      recipient: "ada@example.com",
      subject: "Invoice issued",
      body: "Invoice INV-1 is ready"
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        status: "FAILED",
        failureReason: "User has disabled email notifications"
      })
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(domainEvents.record).not.toHaveBeenCalled();
    expect(mockQueueAdd).not.toHaveBeenCalled();
    expect(result.status).toBe("FAILED");
  });

  it("creates a notification, outbox event, domain event, and queue job when email is enabled", async () => {
    const notification = { id: "notification-1", organizationId: "org-1", status: "QUEUED" };
    const outboxEvent = { id: "outbox-1", type: "notification.queued" };
    const tx = {
      notification: {
        create: jest.fn().mockResolvedValue(notification)
      },
      outboxEvent: {
        create: jest.fn().mockResolvedValue(outboxEvent)
      }
    };
    const prisma = {
      notificationPreference: {
        findUnique: jest.fn().mockResolvedValue(null)
      },
      $transaction: jest.fn((callback) => callback(tx))
    };
    const domainEvents = {
      record: jest.fn().mockResolvedValue({ id: "event-1" })
    };
    const service = new NotificationsService(prisma as any, domainEvents as any);

    const result = await service.createAndQueue({
      organizationId: "org-1",
      userId: "user-1",
      type: "invoice_issued",
      channel: "EMAIL",
      recipient: "ada@example.com",
      subject: "Invoice issued",
      body: "Invoice INV-1 is ready"
    });

    expect(tx.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        userId: "user-1",
        type: "invoice_issued",
        status: "QUEUED"
      })
    });
    expect(tx.outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "notification.queued",
        aggregateType: "notification",
        aggregateId: "notification-1"
      })
    });
    expect(domainEvents.record).toHaveBeenCalledWith({
      organizationId: "org-1",
      aggregateType: "notification",
      aggregateId: "notification-1",
      type: "notification.queued",
      payload: expect.objectContaining({ outboxEventId: "outbox-1" })
    });
    expect(mockQueueAdd).toHaveBeenCalledWith(
      "process-outbox-event",
      { outboxEventId: "outbox-1" },
      expect.objectContaining({ attempts: 5 })
    );
    expect(result).toBe(notification);
  });
});
