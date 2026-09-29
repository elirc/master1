# Feature 07 - OpenAPI Generated Frontend Client

## Plan

### Goal

Add an OpenAPI contract and generated TypeScript types so the frontend has a real API contract boundary instead of hand-written request helpers only.

### Impacted Codebase Areas

- `packages/contracts/*`: new package containing OpenAPI spec, generated types, and a small typed client wrapper.
- `tsconfig.base.json`: add path mapping for the contracts package.
- `apps/web/package.json`: depend on contracts package.
- `apps/web/next.config.ts`: transpile the workspace contracts package.
- `apps/web/app/lib/api.ts`: use the shared contracts client.
- `docs/features/07-openapi-generated-client.md`: plan and build journal.

### Implementation Approach

1. Add `@globalwork/contracts` package.
2. Add `openapi/globalwork.openapi.yaml` covering the major current endpoints.
3. Generate `src/generated/schema.ts` with `openapi-typescript`.
4. Add a reusable `createApiClient()` wrapper that uses generated `paths` types.
5. Update the web API helper to delegate to the shared client.

### Design Considerations

- The OpenAPI spec is intentionally incomplete but covers the important resource families and establishes the contract workflow.
- The generated types should not be edited by hand.
- The client wrapper remains small. It can become richer later with auth token handling, typed path params, structured errors, and generated operation helpers.
- OpenAPI is a forcing function: every new API feature should update the contract.

## Build Journal

Implemented:

- Added `@globalwork/contracts` workspace package.
- Added `openapi/globalwork.openapi.yaml` covering auth and the major resource-list endpoints.
- Generated `src/generated/schema.ts` with `openapi-typescript`.
- Added a small shared `createApiClient()` wrapper that attaches bearer tokens and uses generated `paths` types.
- Added TypeScript path mapping for `@globalwork/contracts`.
- Updated the web package to depend on contracts and transpile it through Next.js.
- Updated the frontend API helper to delegate to the contracts client.
- Added demo sign-in controls to the dashboard so protected API routes remain usable.

Verification:

- Ran `corepack pnpm install`.
- Ran `corepack pnpm --filter @globalwork/contracts generate`.
- Ran `corepack pnpm typecheck`.

Lessons learned:

- OpenAPI is not only documentation; it is a contract artifact that can produce code.
- The first generated client does not need to be perfect to be valuable. It creates a workflow: update API, update spec, regenerate types, update frontend.
- The dashboard now experiences the auth system like a real client app by storing and sending bearer tokens.
- The next maturity step is generating operation-specific functions and keeping the OpenAPI document synchronized automatically from Nest decorators.
