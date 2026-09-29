# 17 - Operations Dashboard

Source: `apps/web/app/ui/operations-dashboard.tsx`

## Why This File Matters

This is the main frontend orchestration file. It is not just visual UI; it demonstrates how a user drives the EOR workflow from the browser: create hire, submit hire, approve hire, complete onboarding, approve documents, activate worker, create payroll, advance payroll, generate invoice, issue invoice, mark paid.

## Line-By-Line Reading Notes

Line 1 says `"use client"`. In Next.js App Router, files are server components by default. This dashboard needs browser state and event handlers, so it must be a client component.

Lines 3-16 import icons from `lucide-react`.

Line 17 imports React hooks and `FormEvent`.

Line 18 imports the local API helpers.

Lines 20-75 define TypeScript interfaces for the data this component expects from the API. These are frontend-side shapes, not generated types yet.

Line 77 hardcodes the demo organization id. This is okay for the initial local demo, but should eventually be replaced by selected organization context.

Lines 79-88 initialize component state: organizations, countries, hires, workers, payroll cycles, invoices, notifications, busy action label, and error message.

Lines 90-98 derive metrics from state. `useMemo` is used for payroll total because it reduces nested arrays; it recalculates only when payroll cycles change.

Lines 100-118 define `refresh()`. This is the data-loading hub. It calls all major list endpoints in parallel with `Promise.all`, then updates state.

Lines 120-122 run `refresh()` once when the component mounts. The `void` pattern makes it explicit that the promise is intentionally not awaited directly by React.

Lines 124-135 define `runAction()`. This is an important UI pattern. It sets busy state, clears errors, runs an API action, refreshes data afterward, captures errors, and always clears busy state.

Lines 137-156 define `createHire()`. It reads form data, builds the API payload, calculates salary currency from the selected country, sends the request, and resets the form.

Lines 158-349 return the JSX layout.

Lines 159-175 render the shell and sidebar navigation.

Lines 177-186 render the top bar and refresh button.

Line 188 conditionally renders errors.

Lines 190-195 render metric tiles.

Lines 197-245 render the hiring section. This includes the create-hire form and the hire pipeline list. Buttons appear conditionally based on status.

Lines 247-270 render worker onboarding. The buttons simulate completing profile, uploading/reviewing required docs, and activating the worker.

Lines 272-320 render payroll and notifications. Payroll actions are based on `nextPayrollStatus()`.

Lines 322-346 render invoices. Draft invoices can be issued; unpaid invoices can be marked paid.

Lines 352-360 define `Metric`, a small presentational component.

Lines 362-387 define `WorkflowList`, a reusable row-list component used for hires, workers, payroll, notifications, and invoices.

Lines 389-391 define `countryCurrency()`, which looks up default currency from country data.

Lines 393-398 define `formatMoney()`. It converts minor units to display currency by dividing by 100.

Lines 400-402 define `readError()`, a small helper to normalize unknown caught errors.

Lines 404-413 define `completeProfile()`, a demo helper that sends a complete worker profile.

Lines 415-432 define `uploadRequiredDocs()`. It reads required documents from the country profile, avoids already-uploaded types, creates missing document records, and immediately approves them.

Lines 434-441 define `createPayrollCycle()`. It creates a hardcoded May 2026 GB payroll cycle for the demo org.

Lines 443-455 define `nextPayrollStatus()`. This mirrors the backend payroll state machine for UI convenience. The backend still owns enforcement.

## Codebase Connections

- Calls endpoints implemented by hiring, workers, documents, payroll, invoices, countries, organizations, and notifications modules.
- Uses `apiGet` and `apiSend`.
- Relies on seed data for `demo-org-acme`.

## Senior-Level Questions

- Is this component too large? Yes, eventually. Split by workflow once behavior stabilizes.
- Should frontend types be generated from OpenAPI? Yes, that would reduce drift.
- Should the frontend duplicate state-machine logic? It can for display, but backend must remain authoritative.
- Should demo helper buttons become real forms? Yes, as the project matures.
