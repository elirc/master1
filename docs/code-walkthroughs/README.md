# Code Walkthroughs

This directory is a guided tour of the highest-value files in the GlobalWork codebase. The goal is to practice a real professional skill: entering an unfamiliar codebase, building a mental model, and tracing how a user action becomes data changes across the system.

These walkthroughs intentionally focus on the top slice of human-authored files, not generated files such as `dist`, `.next`, or `node_modules`. The chosen files are the ones that explain the architecture, domain model, workflow rules, UI orchestration, async worker surface, and test scaffolding.

## Suggested Reading Order

1. [Prisma Schema](./01-prisma-schema.md)
2. [Seed Data](./02-database-seed.md)
3. [Domain States](./03-domain-states.md)
4. [Country Profiles](./04-domain-country-profile.md)
5. [Money Helpers](./05-domain-money.md)
6. [API Bootstrap](./06-api-main.md)
7. [API Module Composition](./07-api-app-module.md)
8. [Request Context](./08-request-context.md)
9. [Prisma Service](./09-prisma-service.md)
10. [Audit Service](./10-audit-service.md)
11. [Hiring Service](./11-hiring-service.md)
12. [Workers Service](./12-workers-service.md)
13. [Documents Service](./13-documents-service.md)
14. [Payroll Service](./14-payroll-service.md)
15. [Invoices Service](./15-invoices-service.md)
16. [Frontend API Client](./16-web-api-client.md)
17. [Operations Dashboard](./17-operations-dashboard.md)
18. [Worker Process](./18-worker-process.md)
19. [Shared Config](./19-shared-config.md)
20. [Testcontainers Helper](./20-testcontainers-helper.md)

## How To Use These Notes

Read each source file first, then read its walkthrough. Do not try to memorize every line. Instead, ask:

- What responsibility does this file own?
- What does it import?
- What does it export?
- Which module calls it?
- Which module does it call?
- What invariants does it protect?
- What could go wrong if this file were changed carelessly?

That pattern is much closer to how senior engineers learn a codebase than reading files randomly from top to bottom.
