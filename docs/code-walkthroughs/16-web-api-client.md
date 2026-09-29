# 16 - Web API Client

Source: `apps/web/app/lib/api.ts`

## Why This File Matters

This file is the frontend's small boundary to the backend. Even a tiny API client is useful because it centralizes base URL handling, JSON parsing, and error handling.

## Line-By-Line Reading Notes

Line 1 reads `NEXT_PUBLIC_API_BASE_URL`, falling back to the local API URL. The `NEXT_PUBLIC_` prefix matters in Next.js because only variables with that prefix are exposed to browser code.

Lines 3-14 define `apiGet<T>()`.

Line 3 uses a generic type parameter. The caller can say `apiGet<Worker[]>("/workers")`, and TypeScript treats the result as a worker array.

Lines 4-6 call `fetch`. `cache: "no-store"` tells Next not to cache these operational data requests.

Lines 8-10 throw an error when the backend returns a non-2xx status.

Line 12 parses JSON and casts it to the caller-provided type. This is convenient but not runtime validation. A future improvement would validate responses with Zod or generated OpenAPI clients.

Lines 16-36 define `apiSend<T>()` for POST and PATCH requests.

Lines 17-23 construct a `RequestInit` object.

Lines 25-27 only add `body` when a body exists. This avoids passing `body: undefined`, which strict TypeScript rejects under `exactOptionalPropertyTypes`.

Lines 29-31 call `fetch` with the constructed options.

Lines 33-35 throw on non-2xx responses.

Line 37 parses JSON.

## Codebase Connections

- `OperationsDashboard` uses this client for all backend calls.
- The base URL must match the API's global prefix from `main.ts`.
- This file would be replaced or expanded by generated API clients once OpenAPI is added.

## Senior-Level Questions

- Should this layer handle auth headers?
- Should it parse structured API errors?
- Should it validate responses at runtime?
- Should there be separate client-side and server-side API clients?
