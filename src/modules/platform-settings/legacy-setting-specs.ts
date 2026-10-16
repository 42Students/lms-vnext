/** Exact documented key inventory from legacy Super Admin TenantSettings.
 * Values are strings in storage; these declarations control type validation. */
export const LEGACY_TENANT_SETTING_SPECS=[
  {
    "key": "baseDomain",
    "scope": "GLOBAL",
    "type": "text",
    "label": "Base domain",
    "group": "Platform & auth",
    "dangerous": true
  },
  {
    "key": "globalHost",
    "scope": "GLOBAL",
    "type": "text",
    "label": "Global host",
    "group": "Platform & auth",
    "dangerous": true
  },
  {
    "key": "cookieDomain",
    "scope": "GLOBAL",
    "type": "text",
    "label": "Auth cookie domain",
    "group": "Platform & auth",
    "dangerous": true
  },
  {
    "key": "cookieSameSite",
    "scope": "GLOBAL",
    "type": "text",
    "label": "Auth cookie SameSite",
    "group": "Platform & auth",
    "dangerous": true
  },
  {
    "key": "policy.superadmin.ipAllowlist",
    "scope": "GLOBAL",
    "type": "text",
    "label": "Super-admin IP allowlist",
    "group": "Platform & auth",
    "dangerous": true
  },
  {
    "key": "otp.maxAttempts",
    "scope": "GLOBAL",
    "type": "int",
    "label": "OTP attempt limit",
    "group": "Platform & auth",
    "dangerous": false,
    "min": 1,
    "max": 100
  },
  {
    "key": "otp.windowSeconds",
    "scope": "GLOBAL",
    "type": "int",
    "label": "OTP lockout window (seconds)",
    "group": "Platform & auth",
    "dangerous": false,
    "min": 30,
    "max": 86400
  },
  {
    "key": "sms.senderId",
    "scope": "GLOBAL",
    "type": "text",
    "label": "SMS sender ID",
    "group": "SMS",
    "dangerous": true
  },
  {
    "key": "sms.attendanceAbsenceTemplate",
    "scope": "GLOBAL",
    "type": "textarea",
    "label": "Attendance: absence SMS",
    "group": "SMS",
    "dangerous": true
  },
  {
    "key": "sms.attendanceCorrectionTemplate",
    "scope": "GLOBAL",
    "type": "textarea",
    "label": "Attendance: correction SMS",
    "group": "SMS",
    "dangerous": true
  },
  {
    "key": "sms.traiJobUpdateTemplate",
    "scope": "GLOBAL",
    "type": "textarea",
    "label": "Placements: job update SMS",
    "group": "SMS",
    "dangerous": true
  },
  {
    "key": "course.watchedThresholdPercent",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Video 'watched' threshold (%)",
    "group": "Course & progress",
    "dangerous": false,
    "min": 1,
    "max": 100
  },
  {
    "key": "course.minInProgressPercent",
    "scope": "GLOBAL",
    "type": "int",
    "label": "'In progress' lower bound (%)",
    "group": "Course & progress",
    "dangerous": false,
    "min": 0,
    "max": 100
  },
  {
    "key": "ui.chatPollIntervalMs",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Classroom chat poll interval (ms)",
    "group": "Course & progress",
    "dangerous": false,
    "min": 3000,
    "max": 600000
  },
  {
    "key": "ui.progressSaveIntervalMs",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Video progress save interval (ms)",
    "group": "Course & progress",
    "dangerous": false,
    "min": 5000,
    "max": 600000
  },
  {
    "key": "attendance.eligibilityThresholdPercent",
    "scope": "COLLEGE",
    "type": "int",
    "label": "Exam eligibility threshold (%)",
    "group": "Attendance",
    "dangerous": false,
    "min": 1,
    "max": 100
  },
  {
    "key": "attendance.correctionWindowHours",
    "scope": "COLLEGE",
    "type": "int",
    "label": "Retroactive marking window (hours)",
    "group": "Attendance",
    "dangerous": false,
    "min": 1,
    "max": 8760
  },
  {
    "key": "schedule.pastBookingGraceMinutes",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Past-booking grace (minutes)",
    "group": "Attendance",
    "dangerous": false,
    "min": 0,
    "max": 1440
  },
  {
    "key": "interview.overlapWindowMinutes",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Interview overlap window (minutes)",
    "group": "Placements",
    "dangerous": false,
    "min": 0,
    "max": 1440
  },
  {
    "key": "interview.overlapBufferMinutes",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Interview buffer (minutes)",
    "group": "Placements",
    "dangerous": false,
    "min": 0,
    "max": 1440
  },
  {
    "key": "interview.durationMinMinutes",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Interview minimum duration (minutes)",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 1440
  },
  {
    "key": "interview.durationMaxMinutes",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Interview maximum duration (minutes)",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 1440
  },
  {
    "key": "placement.applyRateLimitPerMinute",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Job application rate limit (per minute)",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 1000
  },
  {
    "key": "placement.staleAppliedDays",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Stale application age (days)",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 365
  },
  {
    "key": "placement.closingSoonDays",
    "scope": "GLOBAL",
    "type": "int",
    "label": "'Closing soon' window (days)",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 365
  },
  {
    "key": "placement.lowConversionThreshold",
    "scope": "GLOBAL",
    "type": "decimal",
    "label": "Low conversion threshold (0–1)",
    "group": "Placements",
    "dangerous": false,
    "min": 0,
    "max": 1
  },
  {
    "key": "placement.needsAttentionSampleCap",
    "scope": "GLOBAL",
    "type": "int",
    "label": "'Needs attention' sample cap",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 1000
  },
  {
    "key": "ops.bulkStatusMax",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Bulk status-update cap",
    "group": "Operational caps",
    "dangerous": false,
    "min": 1,
    "max": 10000
  },
  {
    "key": "ops.progressBulkIdsMax",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Progress bulk request cap",
    "group": "Operational caps",
    "dangerous": false,
    "min": 1,
    "max": 10000
  },
  {
    "key": "ops.identityMaxJsonSize",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Identity documents JSON size cap",
    "group": "Operational caps",
    "dangerous": false,
    "min": 100,
    "max": 1000000
  },
  {
    "key": "ops.announcementMaxPageSize",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Announcement page size cap",
    "group": "Operational caps",
    "dangerous": false,
    "min": 1,
    "max": 10000
  }
] as const;
export type LegacyTenantSettingKey=typeof LEGACY_TENANT_SETTING_SPECS[number]["key"];
export type LegacyTenantSettingSpec=typeof LEGACY_TENANT_SETTING_SPECS[number];
export const LEGACY_TENANT_SETTING_MAP=new Map<string,LegacyTenantSettingSpec>(
 LEGACY_TENANT_SETTING_SPECS.map(spec=>[spec.key,spec]),
);
