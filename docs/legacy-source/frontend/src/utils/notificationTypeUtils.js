// Single shared type -> {color, label} vocabulary for notification/announcement tags. Used by
// both the main Notifications page (src/components/Notifications/NotificationsContent.jsx) and
// the header notification dropdown (src/components/Dropdowns/Notification/NotifivationDropdown.js)
// — those two previously kept independent copies of this mapping that had already drifted apart
// (e.g. the dropdown used color="blue" for JOB while the main page used "cyan"). Keeping one copy
// here means a new notification_type/receiverType only needs to be taught to the app once.
//
// JOB/COURSE/PROJECT/GENERAL/SYSTEM are Notification-table `notification_type` values
// (personal/recipient-scoped items — a learner's course updates, a mentor's project assignment).
// COLLEGE/DEPARTMENT/PROGRAM/CLASS/LEARNER/FACULTY are Announcement-table `receiverType` values —
// a disjoint taxonomy from a second table, merged into the same list on the frontend.
export const NOTIFICATION_TYPE_CONFIG = {
  JOB: { color: "cyan", label: "Job" },
  COURSE: { color: "green", label: "Course" },
  PROJECT: { color: "geekblue", label: "Project" },
  GENERAL: { color: "purple", label: "Announcement" },
  SYSTEM: { color: "orange", label: "System" },
  COLLEGE: { color: "cyan", label: "College" },
  DEPARTMENT: { color: "green", label: "Department" },
  FACULTY: { color: "purple", label: "Faculty" },
  PROGRAM: { color: "gold", label: "Program" },
  CLASS: { color: "blue", label: "Class" },
  LEARNER: { color: "magenta", label: "Student" },
};

// The two original call sites disagreed on the ULTIMATE fallback (a record with no recognized
// type/receiverType and no course_id) — the dropdown showed a plain grey "General" tag, while the
// main Notifications page showed GENERAL's purple "Announcement" tag. That's a real behavioral
// difference, not just a color, so consolidating this mapping can't silently pick one for both
// callers without changing the other's behavior. Default to the dropdown's plainer fallback (it's
// the simpler, more conservative of the two) and let a caller that wants the other one pass it in.
export const DEFAULT_NOTIFICATION_TYPE_CONFIG = { color: "default", label: "General" };

/**
 * Resolve the {color, label} tag config for a merged notification/announcement record.
 * Falls back to a generic "Course" tag when the record carries a course_id but no recognized
 * type/receiverType (older rows created before notification_type existed), then to `fallback`
 * (defaults to DEFAULT_NOTIFICATION_TYPE_CONFIG).
 */
export function getNotificationTypeConfig(record, fallback = DEFAULT_NOTIFICATION_TYPE_CONFIG) {
  const type = record?.notification_type || record?.notificationType;
  if (type && NOTIFICATION_TYPE_CONFIG[type]) return NOTIFICATION_TYPE_CONFIG[type];

  const receiverType = record?.receiverType || record?.receiver_type;
  if (receiverType && NOTIFICATION_TYPE_CONFIG[receiverType]) return NOTIFICATION_TYPE_CONFIG[receiverType];

  if ((record?.course_id ?? record?.courseId) > 0) return NOTIFICATION_TYPE_CONFIG.COURSE;

  return fallback;
}
