# Feature 28 - Notification Preferences

## Plan

### Goal

Let users opt in or out of notification types so email behavior becomes user-configurable rather than always-on.

### Impacted Codebase Areas

- `packages/database/prisma/schema.prisma`: add notification preference model.
- `apps/api/src/modules/notifications/*`: add preference endpoints and honor preferences when queueing user notifications.
- `docs/features/28-notification-preferences.md`: plan and build journal.

### Implementation Approach

1. Add `NotificationPreference` scoped to user and notification type.
2. Add list/upsert endpoints for the current user.
3. Check preferences before creating user-targeted notifications.
4. Keep organization-level notifications enabled by default.
5. Audit can be added later if preferences become regulated settings.

### Design Considerations

- Preferences are user settings, not tenant settings.
- Notification creation should stay centralized so preferences apply consistently.
- The first implementation supports email enablement only.

## Build Journal

Added `NotificationPreference` and current-user preference endpoints under `notifications/preferences`. `NotificationsService.createAndQueue()` now checks user preferences before queueing user-targeted email work.

The important design lesson is centralization. Preference enforcement belongs in the notification service because every module should not need to remember how opt-outs work.
