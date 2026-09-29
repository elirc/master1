import { BadRequestException, Injectable } from "@nestjs/common";
import type { RequestContext } from "../../common/request-context";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../prisma/services/audit.service";
import { PrismaService } from "../prisma/services/prisma.service";
import { RecordInvoicePaymentDto } from "./dto/record-invoice-payment.dto";

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService
  ) {}

  list(organizationId?: string) {
    return this.prisma.invoice.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { createdAt: "desc" },
      include: { lineItems: true, payrollCycle: true, payments: true }
    });
  }

  async createFromPayroll(context: RequestContext, payrollCycleId: string) {
    const cycle = await this.prisma.payrollCycle.findUniqueOrThrow({
      where: { id: payrollCycleId },
      include: { items: true, invoice: true }
    });

    if (cycle.invoice) {
      throw new BadRequestException("Payroll cycle already has an invoice.");
    }

    if (!["APPROVED", "LOCKED", "PROCESSED", "CLOSED"].includes(cycle.status)) {
      throw new BadRequestException("Payroll must be approved before an invoice can be generated.");
    }

    const currency = cycle.items[0]?.currency ?? "USD";
    if (cycle.items.some((item) => item.currency !== currency)) {
      throw new BadRequestException("Cannot invoice mixed-currency payroll cycles.");
    }

    const subtotalMinor = cycle.items.reduce((sum, item) => sum + item.amountMinor, 0);
    const serviceFeeMinor = Math.round(subtotalMinor * 0.07);
    const totalMinor = subtotalMinor + serviceFeeMinor;

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          organizationId: cycle.organizationId,
          payrollCycleId: cycle.id,
          invoiceNumber: `INV-${new Date().getFullYear()}-${cycle.id.slice(-6).toUpperCase()}`,
          currency,
          subtotalMinor,
          serviceFeeMinor,
          totalMinor,
          lineItems: {
            create: [
              ...cycle.items.map((item) => ({
                description: item.description,
                amountMinor: item.amountMinor,
                currency: item.currency
              })),
              {
                description: "GlobalWork platform service fee",
                amountMinor: serviceFeeMinor,
                currency
              }
            ]
          }
        },
        include: { lineItems: true }
      });

      await tx.auditLog.create({
        data: {
          organizationId: cycle.organizationId,
          actorId: context.actorId ?? null,
          action: "invoice.generated",
          entityType: "Invoice",
          entityId: created.id,
          after: {
            invoiceNumber: created.invoiceNumber,
            totalMinor: created.totalMinor,
            currency: created.currency
          }
        }
      });

      return created;
    });

    return invoice;
  }

  async issue(context: RequestContext, id: string) {
    const before = await this.prisma.invoice.findUniqueOrThrow({ where: { id } });
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: "ISSUED",
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: invoice.organizationId },
      action: "invoice.issued",
      entityType: "Invoice",
      entityId: id,
      before: { status: before.status },
      after: { status: invoice.status, dueAt: invoice.dueAt?.toISOString() }
    });

    await this.notifications.createAndQueue({
      organizationId: invoice.organizationId,
      type: "invoice_issued",
      subject: `Invoice ${invoice.invoiceNumber} issued`,
      body: `Invoice ${invoice.invoiceNumber} for ${invoice.currency} ${(invoice.totalMinor / 100).toFixed(2)} is ready for payment.`
    });

    return invoice;
  }

  async markPaid(context: RequestContext, id: string) {
    const before = await this.prisma.invoice.findUniqueOrThrow({ where: { id } });
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date()
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: invoice.organizationId },
      action: "invoice.paid",
      entityType: "Invoice",
      entityId: id,
      before: { status: before.status },
      after: { status: invoice.status }
    });

    return invoice;
  }

  async recordPayment(context: RequestContext, id: string, dto: RecordInvoicePaymentDto) {
    const invoice = await this.prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: { payments: true }
    });
    if (invoice.status === "VOIDED") {
      throw new BadRequestException("Voided invoices cannot receive payments.");
    }
    if (dto.currency !== invoice.currency) {
      throw new BadRequestException("Payment currency must match invoice currency.");
    }

    const paidBefore = invoice.payments.reduce((sum, payment) => sum + payment.amountMinor, 0);
    if (paidBefore + dto.amountMinor > invoice.totalMinor) {
      throw new BadRequestException("Payment would overpay the invoice.");
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId: id,
          amountMinor: dto.amountMinor,
          currency: dto.currency,
          reference: dto.reference,
          notes: dto.notes ?? null,
          receivedAt: new Date(dto.receivedAt)
        }
      });

      const paidAfter = paidBefore + dto.amountMinor;
      const status = paidAfter === invoice.totalMinor ? "PAID" : "PARTIALLY_PAID";
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          status,
          paidAt: status === "PAID" ? new Date(dto.receivedAt) : null
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId: invoice.organizationId,
          actorId: context.actorId ?? null,
          action: "invoice.payment_recorded",
          entityType: "Invoice",
          entityId: id,
          before: { status: invoice.status, paidMinor: paidBefore },
          after: { status: updated.status, paidMinor: paidAfter, paymentId: payment.id }
        }
      });

      return { invoice: updated, payment };
    });
  }

  async generatePdf(context: RequestContext, id: string) {
    const invoice = await this.prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: {
        lineItems: true,
        organization: true
      }
    });

    if (invoice.status === "VOIDED") {
      throw new BadRequestException("Voided invoices cannot generate PDFs.");
    }

    const pdfStorageKey = `invoices/${invoice.organizationId}/${invoice.invoiceNumber}.html`;
    const html = renderInvoiceHtml(invoice);
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        pdfStorageKey,
        pdfGeneratedAt: new Date()
      }
    });

    await this.audit.log({
      context: { ...context, organizationId: invoice.organizationId },
      action: "invoice.pdf_generated",
      entityType: "Invoice",
      entityId: invoice.id,
      after: { pdfStorageKey }
    });

    return {
      invoice: updated,
      artifact: {
        storageKey: pdfStorageKey,
        contentType: "text/html",
        html
      }
    };
  }
}

function renderInvoiceHtml(invoice: {
  invoiceNumber: string;
  currency: string;
  totalMinor: number;
  subtotalMinor: number;
  serviceFeeMinor: number;
  organization: { legalName: string; billingEmail: string };
  lineItems: Array<{ description: string; amountMinor: number; currency: string }>;
}) {
  const rows = invoice.lineItems
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.description)}</td><td>${item.currency} ${(item.amountMinor / 100).toFixed(2)}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${invoice.invoiceNumber}</title></head>
<body>
  <h1>Invoice ${invoice.invoiceNumber}</h1>
  <p>Bill to: ${escapeHtml(invoice.organization.legalName)} (${escapeHtml(invoice.organization.billingEmail)})</p>
  <table>
    <thead><tr><th>Description</th><th>Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p>Subtotal: ${invoice.currency} ${(invoice.subtotalMinor / 100).toFixed(2)}</p>
  <p>Service fee: ${invoice.currency} ${(invoice.serviceFeeMinor / 100).toFixed(2)}</p>
  <strong>Total: ${invoice.currency} ${(invoice.totalMinor / 100).toFixed(2)}</strong>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
