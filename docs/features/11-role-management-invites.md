# Feature 11 - Role Management And Invites

## Plan

### Goal

Add organization user invitations and role management so client organizations can grow from one seeded owner into a realistic multi-user tenant.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add invitation status/model and user relations.
- `apps/api/src/modules/organizations/*`: add invite, accept, revoke, member list, and role update behavior.
- `apps/api/src/modules/organizations/dto/*`: add invitation and role DTOs.
- `docs/features/11-role-management-invites.md`: plan and build journal.

### Implementation Approach

1. Add `Invitation` model with token, email, role, status, inviter, and expiry.
2. Add protected endpoint to invite organization users.
3. Add public endpoint to accept an invitation and create or reuse a user.
4. Add protected endpoint to revoke an invitation.
5. Add protected endpoint to update an existing organization member role.
6. Audit invitation and role-management actions.

### Design Considerations

- Invitations are tenant-scoped and role-bearing.
- Accepting an invite creates membership in the invited organization.
- This first version returns tokens directly for local development. A production version would email the invite link through notification queues.
- Role changes are security-sensitive and must be audited.

## Build Journal

Added a tenant-scoped invitation model to Prisma with token, email, requested role, inviter, expiry, and status. This creates a durable business record for inviting users instead of treating invites as temporary controller behavior.

The organizations module now supports listing members, inviting a member, accepting an invitation, revoking an invitation, and updating a member role. The protected organization routes use the existing auth and role guards, while accepting an invite is public because the token is the proof that the user reached the invite flow.

Accepting an invite either reuses an existing user by email or creates a new user with a hashed password. It then upserts the organization membership and marks the invitation as accepted. Role changes and invitation lifecycle events write audit logs because permission changes are security-sensitive.

One subtle supporting change happened in the organization role guard: it can now read an organization id from the `:id` route parameter used by organization routes. This is a good example of feature work uncovering assumptions in shared infrastructure.

The key lesson is that user management is not just CRUD. Invites, roles, expiry, revocation, acceptance, idempotency, and auditability all matter because they affect who can see and change tenant data.
