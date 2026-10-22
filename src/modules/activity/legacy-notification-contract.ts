/**
 * Migration crosswalk for the former /api/v1/notification controller.
 *
 * These are NOT aliases. Old integer class/course/recipient/notification IDs
 * must be resolved through an authenticated, tenant-scoped import crosswalk,
 * never cast to UUIDs or accepted as a caller-selected recipient.
 * Retired actions deliberately have no live REST alias in vNext.
 */
export const LEGACY_NOTIFICATION_OPERATION_CROSSWALK = {
  createNotification: {
    old: "POST /api/v1/notification/createNotification",
    replacement: "POST /api/notifications/staff",
    status: "REPLACED",
    scope: "STAFF_AUTHORIZED_CLASS_OR_COURSE",
  },
  fetchAll: {
    old: "GET /api/v1/notification/fetchAll",
    replacement: "GET /api/notifications/staff",
    status: "REPLACED",
    scope: "PERSISTED_SUPER_ADMIN_SCOPE",
  },
  fetchById: {
    old: "GET /api/v1/notification/fetch/{id}",
    replacement: null,
    status: "RETIRED",
    scope: "LEGACY_NUMERIC_ID_NOT_AN_AUTHORIZATION_KEY",
  },
  getNotifications: {
    old: "GET /api/v1/notification/getNotifications",
    replacement: "GET /api/notifications",
    status: "REPLACED",
    scope: "AUTHENTICATED_RECIPIENT_CLASS_OR_COURSE",
  },
  getNotificationsByClassId: {
    old: "GET /api/v1/notification/getNotificationsByClassId",
    replacement: "GET /api/notifications",
    status: "REPLACED",
    scope: "AUTHENTICATED_RECIPIENT_SECTION",
  },
  getNotificationsForRecipient: {
    old: "GET /api/v1/notification/getNotificationsForRecipient",
    replacement: "GET /api/notifications",
    status: "REPLACED",
    scope: "SELF_ONLY_NO_RECIPIENT_ID",
  },
  update: {
    old: "PUT /api/v1/notification/update/{id}",
    replacement: "PATCH /api/notifications/staff/{eventId}",
    status: "REPLACED",
    scope: "STAFF_OWNS_EXISTING_AND_TARGET_SCOPE",
  },
  deleteById: {
    old: "DELETE /api/v1/notification/delete/{id}",
    replacement: "DELETE /api/notifications/staff/{eventId}",
    status: "REPLACED",
    scope: "STAFF_OWNS_EXISTING_SCOPE",
  },
  subscribe: {
    old: "GET /api/v1/notification/subscribe",
    replacement: "GET /api/notifications/stream",
    status: "REPLACED",
    scope: "SIGNED_IN_OWN_STREAM",
  },
  deleteNotification: {
    old: "DELETE /api/v1/notification/deleteNotification",
    replacement: "DELETE /api/notifications/staff/{eventId}",
    status: "REPLACED",
    scope: "STAFF_OWNS_EXISTING_SCOPE",
  },
} as const;

export type LegacyNotificationOperation =
  keyof typeof LEGACY_NOTIFICATION_OPERATION_CROSSWALK;

/** Use for migration tooling and operator-facing upgrade notes only. */
export function getLegacyNotificationMigration(operation:LegacyNotificationOperation) {
 return LEGACY_NOTIFICATION_OPERATION_CROSSWALK[operation];
}
