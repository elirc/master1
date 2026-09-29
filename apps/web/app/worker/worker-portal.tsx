"use client";

import { BriefcaseBusiness, FileCheck2, LogOut, ReceiptText, Umbrella } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { clearSession, getStoredSession } from "../lib/session";

interface PortalResponse {
  worker: {
    legalName: string;
    status: string;
    countryCode: string;
    organization: { legalName: string };
    profile?: { completedAt?: string | null } | null;
    documents: Array<{ id: string; type: string; title: string; status: string }>;
    timeOffRequests: Array<{ id: string; type: string; status: string; startDate: string; endDate: string }>;
    expenses: Array<{ id: string; category: string; status: string; description: string; amountMinor: number; currency: string }>;
  };
  onboarding: {
    profileComplete: boolean;
    approvedDocuments: number;
    pendingDocuments: number;
  };
}

export function WorkerPortal() {
  const [portal, setPortal] = useState<PortalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredSession()) {
      window.location.href = "/login";
      return;
    }

    void apiGet<PortalResponse>("/workers/self/portal")
      .then(setPortal)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Worker portal is unavailable.");
      });
  }, []);

  function logout() {
    clearSession();
    window.location.href = "/login";
  }

  if (error) {
    return (
      <main className="portalShell">
        <section className="portalHeader">
          <div>
            <p className="eyebrow">Worker portal</p>
            <h1>Self service</h1>
          </div>
          <button onClick={logout}><LogOut size={16} /> Sign out</button>
        </section>
        <div className="error">{error}</div>
      </main>
    );
  }

  if (!portal) {
    return <main className="portalShell"><p className="empty">Loading portal...</p></main>;
  }

  return (
    <main className="portalShell">
      <section className="portalHeader">
        <div>
          <p className="eyebrow">{portal.worker.organization.legalName}</p>
          <h1>{portal.worker.legalName}</h1>
          <p className="session">{portal.worker.countryCode} worker - {portal.worker.status.replaceAll("_", " ")}</p>
        </div>
        <button onClick={logout}><LogOut size={16} /> Sign out</button>
      </section>

      <section className="metricGrid">
        <Metric icon={<BriefcaseBusiness size={18} />} label="Profile" value={portal.onboarding.profileComplete ? "Complete" : "Open"} />
        <Metric icon={<FileCheck2 size={18} />} label="Approved Docs" value={String(portal.onboarding.approvedDocuments)} />
        <Metric icon={<Umbrella size={18} />} label="Time Off" value={String(portal.worker.timeOffRequests.length)} />
        <Metric icon={<ReceiptText size={18} />} label="Expenses" value={String(portal.worker.expenses.length)} />
      </section>

      <section className="band threeColumn">
        <PortalList
          title="Documents"
          rows={portal.worker.documents.map((document) => `${document.title} - ${document.status.replaceAll("_", " ")}`)}
        />
        <PortalList
          title="Time Off"
          rows={portal.worker.timeOffRequests.map((request) => `${request.type} - ${request.status}`)}
        />
        <PortalList
          title="Expenses"
          rows={portal.worker.expenses.map((expense) => `${expense.description} - ${formatMoney(expense.amountMinor, expense.currency)} - ${expense.status}`)}
        />
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function PortalList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div>
      <h2>{title}</h2>
      <div className="rows">
        {rows.length === 0 ? <p className="empty">No records yet.</p> : null}
        {rows.map((row) => (
          <article key={row} className="portalRow">{row}</article>
        ))}
      </div>
    </div>
  );
}

function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountMinor / 100);
}
