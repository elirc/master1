# 08 - Request Context

Source: `apps/api/src/common/request-context.ts`

## Why This File Matters

Request context carries information about who is acting and which tenant they are acting within. In production, this would usually come from authentication middleware. In this initial version, headers simulate that context.

## Line-By-Line Reading Notes

Lines 1-4 define `RequestContext`. It has optional `actorId` and `organizationId`.

`actorId` is the user performing the action.

`organizationId` is the tenant context. This matters for audit logs and, eventually, permission enforcement.

Lines 6-15 define `contextFromHeaders()`. It receives the raw headers object from a Nest controller.

Line 7 reads `x-user-id`.

Line 8 reads `x-organization-id`.

Lines 10-13 return an object that only includes keys when values exist. The spread pattern avoids explicitly setting properties to undefined.

Lines 16-21 define `singleHeader()`. HTTP header values can be a string or an array of strings. This helper normalizes both cases into one optional string.

## Codebase Connections

- Controllers call `contextFromHeaders(headers)`.
- Services pass context to `AuditService`.
- Some direct transaction audit writes use `context.actorId ?? null`.

## Senior-Level Questions

- Should controllers parse auth headers directly? No, this is temporary.
- What should replace this later? A Nest guard or interceptor that attaches authenticated user context to the request.
- Should every organization-scoped query use this context? Eventually yes, tenant isolation should be enforced centrally.
