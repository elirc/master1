# Feature 08 - Real Frontend Auth Flow

## Plan

### Goal

Move the frontend from inline demo sign-in buttons to a proper client-side authentication flow: login page, stored session, current-user loading, protected dashboard behavior, logout, and role-aware navigation.

### Impacted Codebase Areas

- `apps/web/app/login/*`: new login route and form.
- `apps/web/app/lib/session.ts`: shared browser session helpers.
- `apps/web/app/ui/operations-dashboard.tsx`: protect dashboard loading, load current user, logout, and role-aware nav.
- `apps/web/app/globals.css`: login/auth UI styles.
- `docs/features/08-frontend-auth-flow.md`: plan and build journal.

### Implementation Approach

1. Add browser-local session helpers for token/user persistence.
2. Add `/login` page with email/password and demo account shortcuts.
3. On dashboard mount, redirect to `/login` when no token exists.
4. Call `/auth/me` to validate the current token before loading protected data.
5. Clear session and redirect on auth failure.
6. Render navigation based on platform/client role.
7. Add logout action.

### Design Considerations

- Local storage is acceptable for this learning-stage app, but production auth should use stronger session handling.
- The frontend can hide navigation by role for usability, but the backend remains the real authorization boundary.
- This feature makes token expiration visible: if `/auth/me` fails, the session is cleared and the user returns to login.

## Build Journal

Implemented the login flow as a small frontend feature slice rather than mixing auth behavior into the existing dashboard. The new `apps/web/app/login/page.tsx` route owns the page shell, while `apps/web/app/login/login-form.tsx` owns form state, demo-account shortcuts, submission, error handling, and redirect after success.

Shared browser session behavior moved into `apps/web/app/lib/session.ts`. That file gives the app one place to understand the local storage keys, the stored session shape, and role helpers such as `canViewFinance()`. This is intentionally modest, but it is still an important boundary: when session storage changes later, the dashboard and login form should not both need custom local-storage parsing.

The dashboard now treats authentication as a prerequisite for loading operational data. On mount it checks for a stored session, redirects missing users to `/login`, validates the token through `/auth/me`, and clears the session if validation fails. It also uses the current user's role to hide payroll and invoice navigation for users who should not see finance workflows.

The key lesson is that frontend auth has two jobs. First, it improves the user's navigation experience. Second, it must never be mistaken for backend security. The dashboard can hide finance tabs, but API guards still decide whether finance data can be read or changed.
