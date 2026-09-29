"use client";

import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  FileCheck2,
  FileText,
  Globe2,
  LogOut,
  Play,
  RefreshCw,
  RotateCw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  WalletCards
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "../lib/api";
import { canViewFinance, clearSession, getStoredSession, type StoredUser } from "../lib/session";

interface Organization {
  id: string;
  legalName: string;
  status: string;
  billingCurrency: string;
}

interface CountryProfile {
  countryCode: string;
  countryName: string;
  defaultCurrency: string;
  requiredWorkerDocuments: string[];
}

interface HireRequest {
  id: string;
  organizationId: string;
  workerLegalName: string;
  workerEmail: string;
  countryCode: string;
  jobTitle: string;
  status: string;
}

interface Worker {
  id: string;
  legalName: string;
  countryCode: string;
  status: string;
  documents: Array<{ id: string; type: string; status: string }>;
  profile?: { completedAt?: string | null } | null;
}

interface PayrollCycle {
  id: string;
  status: string;
  countryCode: string;
  periodStart: string;
  periodEnd: string;
  items: Array<{ id: string; description: string; amountMinor: number; currency: string }>;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalMinor: number;
  currency: string;
}

interface Notification {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface OrganizationMember {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expiresAt: string;
}

interface ReviewDocument {
  id: string;
  type: string;
  title: string;
  status: string;
  fileName?: string | null;
  uploadedAt?: string | null;
  worker: { id: string; legalName: string; organizationId: string };
}

interface PayrollAdjustment {
  id: string;
  kind: string;
  status: string;
  description: string;
  amountMinor: number;
  currency: string;
  worker: { id: string; legalName: string };
  payrollCycle?: { id: string; status: string; countryCode: string } | null;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: { name: string; email: string } | null;
  metadata?: unknown;
}

interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description?: string | null;
  organizationId?: string | null;
}

interface BillingAccount {
  billingContactName?: string | null;
  billingContactEmail?: string | null;
  taxId?: string | null;
  paymentTermsDays: number;
  invoiceCurrency: string;
  purchaseOrderRequired: boolean;
  purchaseOrderNumber?: string | null;
}

interface PagedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
}

const demoOrgId = "demo-org-acme";
const organizationRoles = ["CLIENT_OWNER", "CLIENT_HR_ADMIN", "CLIENT_FINANCE", "CLIENT_MANAGER", "WORKER"];
const adjustmentKinds = ["BONUS", "COMMISSION", "ALLOWANCE", "DEDUCTION"];

export function OperationsDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [countries, setCountries] = useState<CountryProfile[]>([]);
  const [hires, setHires] = useState<HireRequest[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [payrollCycles, setPayrollCycles] = useState<PayrollCycle[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [reviewDocuments, setReviewDocuments] = useState<ReviewDocument[]>([]);
  const [payrollAdjustments, setPayrollAdjustments] = useState<PayrollAdjustment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [billingAccount, setBillingAccount] = useState<BillingAccount | null>(null);
  const [auditFilter, setAuditFilter] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");
  const [authUser, setAuthUser] = useState<StoredUser | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeWorkers = workers.filter((worker) => worker.status === "ACTIVE").length;
  const pendingDocuments = workers.flatMap((worker) => worker.documents).filter((document) => document.status !== "APPROVED").length;
  const payrollTotal = useMemo(
    () =>
      payrollCycles
        .flatMap((cycle) => cycle.items)
        .reduce((sum, item) => sum + item.amountMinor, 0),
    [payrollCycles]
  );

  async function refresh() {
    setError(null);
    const session = getStoredSession();
    const user = session?.user ?? authUser;
    const showFinance = canViewFinance(user);
    const showAdminTools = user?.platformRole === "PLATFORM_ADMIN" || user?.memberships?.some((membership) => ["CLIENT_OWNER", "CLIENT_HR_ADMIN"].includes(membership.role));
    const showBillingSettings = user?.platformRole === "PLATFORM_ADMIN" || user?.memberships?.some((membership) => ["CLIENT_OWNER", "CLIENT_FINANCE"].includes(membership.role));
    const [orgs, countryList, hireList, workerList, cycles, invoiceList, notificationList, memberList, inviteList, documentQueue, adjustmentPage, auditPage, flags, billing] = await Promise.all([
      user?.platformRole === "PLATFORM_ADMIN" ? apiGet<Organization[]>("/organizations") : Promise.resolve([]),
      apiGet<CountryProfile[]>("/countries"),
      apiGet<HireRequest[]>(`/hire-requests?organizationId=${demoOrgId}`),
      apiGet<Worker[]>(`/workers?organizationId=${demoOrgId}${workerSearch ? `&search=${encodeURIComponent(workerSearch)}` : ""}`),
      showFinance ? apiGet<PayrollCycle[]>(`/payroll-cycles?organizationId=${demoOrgId}`) : Promise.resolve([]),
      showFinance ? apiGet<Invoice[]>(`/invoices?organizationId=${demoOrgId}`) : Promise.resolve([]),
      apiGet<Notification[]>(`/notifications?organizationId=${demoOrgId}`),
      showAdminTools ? apiGet<OrganizationMember[]>(`/organizations/${demoOrgId}/members`) : Promise.resolve([]),
      showAdminTools ? apiGet<Invitation[]>(`/organizations/${demoOrgId}/invitations`) : Promise.resolve([]),
      user?.platformRole ? apiGet<PagedResponse<ReviewDocument>>(`/documents/review-queue?organizationId=${demoOrgId}&pageSize=10`) : Promise.resolve(emptyPage<ReviewDocument>()),
      showFinance ? apiGet<PagedResponse<PayrollAdjustment>>(`/payroll-adjustments?organizationId=${demoOrgId}&pageSize=10`) : Promise.resolve(emptyPage<PayrollAdjustment>()),
      apiGet<PagedResponse<AuditLog>>(`/audit-logs?organizationId=${demoOrgId}&pageSize=12${auditFilter ? `&action=${encodeURIComponent(auditFilter)}` : ""}`),
      user?.platformRole === "PLATFORM_ADMIN" ? apiGet<FeatureFlag[]>(`/feature-flags?organizationId=${demoOrgId}`) : Promise.resolve([]),
      showBillingSettings ? apiGet<BillingAccount>(`/organizations/${demoOrgId}/billing-account`) : Promise.resolve(null)
    ]);
    setOrganizations(orgs);
    setCountries(countryList);
    setHires(hireList);
    setWorkers(workerList);
    setPayrollCycles(cycles);
    setInvoices(invoiceList);
    setNotifications(notificationList);
    setMembers(memberList);
    setInvitations(inviteList);
    setReviewDocuments(documentQueue.data);
    setPayrollAdjustments(adjustmentPage.data);
    setAuditLogs(auditPage.data);
    setFeatureFlags(flags);
    setBillingAccount(billing);
  }

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    void apiGet<StoredUser>("/auth/me")
      .then((user) => {
        setAuthUser(user);
        return refresh();
      })
      .catch(() => {
        clearSession();
        window.location.href = "/login";
      });
  }, []);

  async function runAction(label: string, action: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (actionError) {
      setError(readError(actionError));
    } finally {
      setBusy(null);
    }
  }

  async function createHire(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction("create-hire", () =>
      apiSend("/hire-requests", "POST", {
        organizationId: demoOrgId,
        workerLegalName: form.get("workerLegalName"),
        workerEmail: form.get("workerEmail"),
        countryCode: form.get("countryCode"),
        jobTitle: form.get("jobTitle"),
        department: form.get("department"),
        managerName: form.get("managerName"),
        startDate: form.get("startDate"),
        salaryAmountMinor: Number(form.get("salaryAmountMinor")),
        salaryCurrency: countryCurrency(String(form.get("countryCode")), countries),
        workLocation: form.get("workLocation")
      })
    );
    event.currentTarget.reset();
  }

  async function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction("invite-member", () =>
      apiSend(`/organizations/${demoOrgId}/invitations`, "POST", {
        email: form.get("email"),
        role: form.get("role")
      })
    );
    event.currentTarget.reset();
  }

  async function updateMemberRole(memberId: string, role: string) {
    return apiSend(`/organizations/${demoOrgId}/members/${memberId}/role`, "PATCH", { role });
  }

  async function createAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const workerId = String(form.get("workerId") ?? "");
    await runAction("create-adjustment", () =>
      apiSend(`/workers/${workerId}/payroll-adjustments`, "POST", {
        kind: form.get("kind"),
        amountMinor: Number(form.get("amountMinor")),
        currency: "USD",
        description: form.get("description"),
        payrollCycleId: String(form.get("payrollCycleId") ?? "") || undefined
      })
    );
    event.currentTarget.reset();
  }

  async function upsertFeatureFlag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction("save-feature-flag", () =>
      saveFeatureFlag(String(form.get("key")), form.get("enabled") === "on", String(form.get("description") ?? ""))
    );
    event.currentTarget.reset();
  }

  async function saveBillingSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction("save-billing-settings", () =>
      apiSend(`/organizations/${demoOrgId}/billing-account`, "PATCH", {
        billingContactName: String(form.get("billingContactName") ?? ""),
        billingContactEmail: String(form.get("billingContactEmail") ?? ""),
        taxId: String(form.get("taxId") ?? ""),
        paymentTermsDays: Number(form.get("paymentTermsDays") ?? 30),
        invoiceCurrency: String(form.get("invoiceCurrency") ?? "USD"),
        purchaseOrderRequired: form.get("purchaseOrderRequired") === "on",
        purchaseOrderNumber: String(form.get("purchaseOrderNumber") ?? "")
      })
    );
  }

  function logout() {
    clearSession();
    window.location.href = "/login";
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Building2 size={24} aria-hidden />
          <div>
            <strong>GlobalWork</strong>
            <span>EOR Console</span>
          </div>
        </div>
        <nav aria-label="Primary">
          <a href="#overview"><Globe2 size={18} /> Overview</a>
          <a href="#hiring"><UserPlus size={18} /> Hiring</a>
          <a href="#workers"><BriefcaseBusiness size={18} /> Workers</a>
          <a href="#documents"><FileCheck2 size={18} /> Documents</a>
          {canViewFinance(authUser) ? <a href="#payroll"><WalletCards size={18} /> Payroll</a> : null}
          {canViewFinance(authUser) ? <a href="#invoices"><FileText size={18} /> Invoices</a> : null}
          <a href="#audit"><ShieldCheck size={18} /> Audit</a>
          {authUser?.platformRole === "PLATFORM_ADMIN" ? <a href="#flags"><SlidersHorizontal size={18} /> Flags</a> : null}
          {canManageBilling(authUser) ? <a href="#settings"><SlidersHorizontal size={18} /> Settings</a> : null}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Acme Robotics workspace</p>
            <h1>Employer of Record operations</h1>
            <p className="session">{authUser ? `Signed in as ${authUser.name}` : "Checking session"}</p>
          </div>
          <div className="topbarActions">
            <button className="iconButton" title="Refresh data" onClick={() => void runAction("refresh", refresh)}>
              <RefreshCw size={18} />
            </button>
            <button className="iconButton" title="Sign out" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {error ? <div className="error">{error}</div> : null}

        <section id="overview" className="metricGrid">
          <Metric icon={<Building2 size={18} />} label="Organizations" value={organizations.length.toString()} />
          <Metric icon={<BriefcaseBusiness size={18} />} label="Active Workers" value={activeWorkers.toString()} />
          <Metric icon={<FileCheck2 size={18} />} label="Pending Documents" value={pendingDocuments.toString()} />
          <Metric icon={<WalletCards size={18} />} label="Payroll Exposure" value={formatMoney(payrollTotal, "USD")} />
        </section>

        <section id="hiring" className="band twoColumn">
          <div>
            <h2>New Hire Request</h2>
            <form className="formGrid" onSubmit={(event) => void createHire(event)}>
              <input name="workerLegalName" placeholder="Worker legal name" required />
              <input name="workerEmail" placeholder="Worker email" type="email" required />
              <select name="countryCode" defaultValue="GB" required>
                {countries.map((country) => (
                  <option key={country.countryCode} value={country.countryCode}>
                    {country.countryName}
                  </option>
                ))}
              </select>
              <input name="jobTitle" placeholder="Job title" required />
              <input name="department" placeholder="Department" />
              <input name="managerName" placeholder="Manager" />
              <input name="startDate" type="date" required />
              <input name="salaryAmountMinor" placeholder="Monthly salary minor units" type="number" defaultValue={650000} required />
              <input name="workLocation" placeholder="Work location" required />
              <button type="submit" disabled={Boolean(busy)}>
                <UserPlus size={16} /> Create hire
              </button>
            </form>
          </div>

          <WorkflowList
            title="Hire Pipeline"
            items={hires.map((hire) => ({
              id: hire.id,
              title: hire.workerLegalName,
              meta: `${hire.countryCode} - ${hire.jobTitle}`,
              status: hire.status,
              actions: (
                <>
                  {hire.status === "DRAFT" ? (
                    <button onClick={() => void runAction("submit-hire", () => apiSend(`/hire-requests/${hire.id}/submit`, "PATCH"))}>
                      <Send size={15} /> Submit
                    </button>
                  ) : null}
                  {["SUBMITTED", "INTERNAL_REVIEW"].includes(hire.status) ? (
                    <button onClick={() => void runAction("approve-hire", () => apiSend(`/hire-requests/${hire.id}/approve`, "PATCH"))}>
                      <BadgeCheck size={15} /> Approve
                    </button>
                  ) : null}
                </>
              )
            }))}
          />
        </section>

        <section id="workers" className="band">
          <div className="sectionHeader">
            <h2>Worker Onboarding</h2>
            <div className="inlineControls">
              <input value={workerSearch} onChange={(event) => setWorkerSearch(event.target.value)} placeholder="Search workers" />
              <button onClick={() => void runAction("search-workers", refresh)}>
                <RefreshCw size={15} /> Search
              </button>
            </div>
          </div>
          <WorkflowList
            title=""
            items={workers.map((worker) => ({
              id: worker.id,
              title: worker.legalName,
              meta: `${worker.countryCode} - ${worker.documents.length} documents - profile ${worker.profile?.completedAt ? "complete" : "open"}`,
              status: worker.status,
              actions: (
                <>
                  <button onClick={() => void runAction("complete-profile", () => completeProfile(worker.id))}>
                    <FileCheck2 size={15} /> Profile
                  </button>
                  <button onClick={() => void runAction("upload-docs", () => uploadRequiredDocs(worker, countries))}>
                    <FileText size={15} /> Docs
                  </button>
                  <button onClick={() => void runAction("activate-worker", () => apiSend(`/workers/${worker.id}/activate`, "PATCH"))}>
                    <Play size={15} /> Activate
                  </button>
                </>
              )
            }))}
          />
        </section>

        <section id="members" className="band twoColumn">
          <div>
            <h2>Members and invites</h2>
            <form className="formGrid compactForm" onSubmit={(event) => void inviteMember(event)}>
              <input name="email" placeholder="teammate@example.com" type="email" required />
              <select name="role" defaultValue="CLIENT_HR_ADMIN">
                {organizationRoles.map((role) => (
                  <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                ))}
              </select>
              <button type="submit" disabled={Boolean(busy)}>
                <UserPlus size={15} /> Invite
              </button>
            </form>
            <DataTable
              rows={members.map((member) => ({
                id: member.id,
                cells: [member.user.name, member.user.email],
                status: member.role,
                actions: (
                  <select
                    aria-label={`Role for ${member.user.email}`}
                    value={member.role}
                    onChange={(event) => void runAction("update-member-role", () => updateMemberRole(member.id, event.target.value))}
                  >
                    {organizationRoles.map((role) => (
                      <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                )
              }))}
            />
          </div>
          <WorkflowList
            title="Open Invitations"
            items={invitations.map((invitation) => ({
              id: invitation.id,
              title: invitation.email,
              meta: `${invitation.role.replaceAll("_", " ")} - expires ${new Date(invitation.expiresAt).toLocaleDateString()}`,
              status: invitation.status,
              actions: invitation.status === "PENDING" ? (
                <button onClick={() => void runAction("revoke-invite", () => apiSend(`/organizations/invitations/${invitation.token}/revoke`, "PATCH"))}>
                  <RotateCw size={15} /> Revoke
                </button>
              ) : null
            }))}
          />
        </section>

        <section id="documents" className="band">
          <WorkflowList
            title="Document Review Queue"
            items={reviewDocuments.map((document) => ({
              id: document.id,
              title: document.title,
              meta: `${document.worker.legalName} - ${document.type} - ${document.fileName ?? "stored object"}`,
              status: document.status,
              actions: (
                <>
                  {["UPLOADED", "PENDING_REVIEW", "REJECTED"].includes(document.status) ? (
                    <button onClick={() => void runAction("approve-document", () => apiSend(`/documents/${document.id}/review`, "PATCH", { status: "APPROVED" }))}>
                      <BadgeCheck size={15} /> Approve
                    </button>
                  ) : null}
                  {document.status !== "REJECTED" ? (
                    <button onClick={() => void runAction("reject-document", () => apiSend(`/documents/${document.id}/review`, "PATCH", { status: "REJECTED", reason: "Needs clearer upload" }))}>
                      <FileCheck2 size={15} /> Reject
                    </button>
                  ) : null}
                </>
              )
            }))}
          />
        </section>

        <section id="payroll" className="band twoColumn">
          <div>
            <h2>Payroll Cycles</h2>
            <div className="toolbar">
              <button onClick={() => void runAction("create-payroll", () => createPayrollCycle())}>
                <WalletCards size={15} /> Create May payroll
              </button>
            </div>
            <WorkflowList
              title=""
              items={payrollCycles.map((cycle) => ({
                id: cycle.id,
                title: `${cycle.countryCode} payroll`,
                meta: `${cycle.items.length} items - ${formatMoney(cycle.items.reduce((sum, item) => sum + item.amountMinor, 0), cycle.items[0]?.currency ?? "USD")}`,
                status: cycle.status,
                actions: (
                  <>
                    {nextPayrollStatus(cycle.status) ? (
                      <button
                        onClick={() =>
                          void runAction("advance-payroll", () =>
                            apiSend(`/payroll-cycles/${cycle.id}/advance`, "PATCH", { status: nextPayrollStatus(cycle.status) })
                          )
                        }
                      >
                        <Play size={15} /> Advance
                      </button>
                    ) : null}
                    {["APPROVED", "LOCKED", "PROCESSED", "CLOSED"].includes(cycle.status) ? (
                      <button onClick={() => void runAction("create-invoice", () => apiSend(`/payroll-cycles/${cycle.id}/invoice`, "POST"))}>
                        <FileText size={15} /> Invoice
                      </button>
                    ) : null}
                  </>
                )
              }))}
            />
          </div>
          <WorkflowList
            title="Notifications"
            items={notifications.map((notification) => ({
              id: notification.id,
              title: notification.subject,
              meta: new Date(notification.createdAt).toLocaleString(),
              status: notification.status,
              actions: <Bell size={16} />
            }))}
          />
        </section>

        {canManageBilling(authUser) ? (
          <section id="adjustments" className="band twoColumn">
            <div>
              <h2>Payroll Adjustments</h2>
              <form className="formGrid compactForm" onSubmit={(event) => void createAdjustment(event)}>
                <select name="workerId" required>
                  <option value="">Worker</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>{worker.legalName}</option>
                  ))}
                </select>
                <select name="kind" defaultValue="BONUS">
                  {adjustmentKinds.map((kind) => (
                    <option key={kind} value={kind}>{kind}</option>
                  ))}
                </select>
                <input name="amountMinor" type="number" min={1} defaultValue={25000} required />
                <input name="description" placeholder="Description" required />
                <select name="payrollCycleId">
                  <option value="">No cycle yet</option>
                  {payrollCycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>{cycle.countryCode} - {cycle.status}</option>
                  ))}
                </select>
                <button type="submit" disabled={Boolean(busy)}>
                  <WalletCards size={15} /> Add adjustment
                </button>
              </form>
            </div>
            <WorkflowList
              title="Adjustment Queue"
              items={payrollAdjustments.map((adjustment) => ({
                id: adjustment.id,
                title: adjustment.description,
                meta: `${adjustment.worker.legalName} - ${adjustment.kind} - ${formatMoney(adjustment.amountMinor, adjustment.currency)}`,
                status: adjustment.status,
                actions: adjustment.status === "SUBMITTED" ? (
                  <>
                    <button onClick={() => void runAction("approve-adjustment", () => apiSend(`/payroll-adjustments/${adjustment.id}/review`, "PATCH", { status: "APPROVED" }))}>
                      <BadgeCheck size={15} /> Approve
                    </button>
                    <button onClick={() => void runAction("reject-adjustment", () => apiSend(`/payroll-adjustments/${adjustment.id}/review`, "PATCH", { status: "REJECTED", decisionReason: "Not approved for this cycle" }))}>
                      <FileCheck2 size={15} /> Reject
                    </button>
                  </>
                ) : null
              }))}
            />
          </section>
        ) : null}

        <section id="invoices" className="band">
          <WorkflowList
            title="Invoices"
            items={invoices.map((invoice) => ({
              id: invoice.id,
              title: invoice.invoiceNumber,
              meta: formatMoney(invoice.totalMinor, invoice.currency),
              status: invoice.status,
              actions: (
                <>
                  {invoice.status === "DRAFT" ? (
                    <button onClick={() => void runAction("issue-invoice", () => apiSend(`/invoices/${invoice.id}/issue`, "PATCH"))}>
                      <Send size={15} /> Issue
                    </button>
                  ) : null}
                  {invoice.status !== "PAID" ? (
                    <button onClick={() => void runAction("pay-invoice", () => apiSend(`/invoices/${invoice.id}/mark-paid`, "PATCH"))}>
                      <BadgeCheck size={15} /> Paid
                    </button>
                  ) : null}
                </>
              )
            }))}
          />
        </section>

        <section id="audit" className="band">
          <div className="sectionHeader">
            <h2>Audit logs</h2>
            <div className="inlineControls">
              <input value={auditFilter} onChange={(event) => setAuditFilter(event.target.value)} placeholder="Filter by action" />
              <button onClick={() => void runAction("refresh-audit", refresh)}>
                <RefreshCw size={15} /> Apply
              </button>
            </div>
          </div>
          <DataTable
            rows={auditLogs.map((log) => ({
              id: log.id,
              cells: [log.action, `${log.entityType}:${log.entityId.slice(0, 8)}`, log.actor?.name ?? "System", new Date(log.createdAt).toLocaleString()],
              status: log.entityType,
              actions: null
            }))}
          />
        </section>

        {authUser?.platformRole === "PLATFORM_ADMIN" ? (
          <section id="flags" className="band twoColumn">
            <div>
              <h2>Feature Flags</h2>
              <form className="formGrid compactForm" onSubmit={(event) => void upsertFeatureFlag(event)}>
                <input name="key" placeholder="worker-self-service" required />
                <input name="description" placeholder="Description" />
                <label className="checkLine">
                  <input name="enabled" type="checkbox" defaultChecked /> Enabled
                </label>
                <button type="submit" disabled={Boolean(busy)}>
                  <SlidersHorizontal size={15} /> Save flag
                </button>
              </form>
            </div>
            <DataTable
              rows={featureFlags.map((flag) => ({
                id: flag.id,
                cells: [flag.key, flag.description ?? "No description"],
                status: flag.enabled ? "ENABLED" : "DISABLED",
                actions: (
                  <button onClick={() => void runAction("toggle-flag", () => saveFeatureFlag(flag.key, !flag.enabled, flag.description ?? ""))}>
                    <SlidersHorizontal size={15} /> Toggle
                  </button>
                )
              }))}
            />
          </section>
        ) : null}

        {canViewFinance(authUser) ? (
          <section id="settings" className="band twoColumn">
            <div>
              <h2>Billing Settings</h2>
              <form className="formGrid compactForm" onSubmit={(event) => void saveBillingSettings(event)}>
                <input name="billingContactName" placeholder="Billing contact name" defaultValue={billingAccount?.billingContactName ?? ""} />
                <input name="billingContactEmail" placeholder="Billing contact email" type="email" defaultValue={billingAccount?.billingContactEmail ?? ""} />
                <input name="taxId" placeholder="Tax ID" defaultValue={billingAccount?.taxId ?? ""} />
                <input name="paymentTermsDays" type="number" min={1} defaultValue={billingAccount?.paymentTermsDays ?? 30} />
                <input name="invoiceCurrency" placeholder="Invoice currency" defaultValue={billingAccount?.invoiceCurrency ?? "USD"} />
                <input name="purchaseOrderNumber" placeholder="Purchase order number" defaultValue={billingAccount?.purchaseOrderNumber ?? ""} />
                <label className="checkLine">
                  <input name="purchaseOrderRequired" type="checkbox" defaultChecked={billingAccount?.purchaseOrderRequired ?? false} /> PO required
                </label>
                <button type="submit" disabled={Boolean(busy)}>
                  <SlidersHorizontal size={15} /> Save settings
                </button>
              </form>
            </div>
            <WorkflowList
              title="CSV Reports"
              items={[
                { id: "workers", title: "Workers export", meta: "CSV report endpoint: /reports/workers.csv", status: "READY", actions: <FileText size={16} /> },
                { id: "invoices", title: "Invoices export", meta: "CSV report endpoint: /reports/invoices.csv", status: "READY", actions: <FileText size={16} /> },
                { id: "audit", title: "Audit export", meta: "CSV report endpoint: /reports/audit.csv", status: "READY", actions: <FileText size={16} /> }
              ]}
            />
          </section>
        ) : null}
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

function WorkflowList({
  title,
  items
}: {
  title: string;
  items: Array<{ id: string; title: string; meta: string; status: string; actions: React.ReactNode }>;
}) {
  return (
    <div className="workflow">
      {title ? <h2>{title}</h2> : null}
      <div className="rows">
        {items.length === 0 ? <p className="empty">No records yet.</p> : null}
        {items.map((item) => (
          <article key={item.id} className="row">
            <div>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
            </div>
            <mark>{item.status.replaceAll("_", " ")}</mark>
            <div className="rowActions">{item.actions}</div>
          </article>
        ))}
      </div>
    </div>
  );
}

function DataTable({
  rows
}: {
  rows: Array<{ id: string; cells: string[]; status: string; actions: React.ReactNode }>;
}) {
  return (
    <div className="dataTable">
      {rows.length === 0 ? <p className="empty">No records yet.</p> : null}
      {rows.map((row) => (
        <article key={row.id} className="dataRow">
          <div className="dataCells">
            {row.cells.map((cell, index) => (
              <span key={`${row.id}-${index}`}>{cell}</span>
            ))}
          </div>
          <mark>{row.status.replaceAll("_", " ")}</mark>
          <div className="rowActions">{row.actions}</div>
        </article>
      ))}
    </div>
  );
}

function countryCurrency(countryCode: string, countries: CountryProfile[]) {
  return countries.find((country) => country.countryCode === countryCode)?.defaultCurrency ?? "USD";
}

function emptyPage<T>(): PagedResponse<T> {
  return {
    data: [],
    meta: { page: 1, pageSize: 25, total: 0, pageCount: 1 }
  };
}

function canManageBilling(user: StoredUser | null) {
  return Boolean(
    user?.platformRole === "PLATFORM_ADMIN" ||
      user?.memberships?.some((membership) => ["CLIENT_OWNER", "CLIENT_FINANCE"].includes(membership.role))
  );
}

function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amountMinor / 100);
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

async function completeProfile(workerId: string) {
  return apiSend(`/workers/${workerId}/profile`, "PATCH", {
    addressLine1: "10 Example Street",
    city: "London",
    region: "England",
    postalCode: "EC1A 1BB",
    taxIdentifier: "DEMO-TAX-ID",
    bankLastFour: "4242"
  });
}

async function uploadRequiredDocs(worker: Worker, countries: CountryProfile[]) {
  const profile = countries.find((country) => country.countryCode === worker.countryCode);
  const requiredDocs = profile?.requiredWorkerDocuments ?? [];
  const existing = new Set(worker.documents.map((document) => document.type));

  for (const type of requiredDocs) {
    if (!existing.has(type)) {
      const created = await apiSend<{ id: string }>(`/workers/${worker.id}/documents`, "POST", {
        type,
        title: `${type.replaceAll("_", " ")} demo document`,
        storageKey: `demo/${worker.id}/${type.toLowerCase()}.pdf`
      });
      await apiSend(`/documents/${created.id}/review`, "PATCH", {
        status: "APPROVED"
      });
    }
  }
}

async function createPayrollCycle() {
  return apiSend("/payroll-cycles", "POST", {
    organizationId: demoOrgId,
    countryCode: "GB",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31"
  });
}

async function saveFeatureFlag(key: string, enabled: boolean, description: string) {
  return apiSend("/feature-flags", "POST", {
    key,
    enabled,
    organizationId: demoOrgId,
    description
  });
}

function nextPayrollStatus(status: string) {
  const next: Record<string, string> = {
    OPEN: "COLLECTING_INPUTS",
    COLLECTING_INPUTS: "INTERNAL_REVIEW",
    INTERNAL_REVIEW: "CLIENT_REVIEW",
    CLIENT_REVIEW: "APPROVED",
    APPROVED: "LOCKED",
    LOCKED: "PROCESSED",
    PROCESSED: "CLOSED"
  };

  return next[status];
}
