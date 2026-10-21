/** Exact documented key inventory from legacy Super Admin TenantSettings.
 * Values are strings in storage; these declarations control type validation.
 * help / placeholder / activation describe legacy DLT/operational semantics.
 * Activation is metadata only: a saved override MUST NOT be represented as
 * active until the deployed service actually consumes it. Existing UI may
 * continue to display a generic runtime warning until wired to these fields.
 */
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
    "dangerous": true,
    "placeholder": "FLERNR",
    "help": "Sender ID must exactly match the TRAI/DLT-registered Exotel sender; saving an override does not activate Exotel or prove provider delivery. Do not enter credentials here.",
    "activation": "DEPLOYMENT_REQUIRED"
  },
  {
    "key": "sms.attendanceAbsenceTemplate",
    "scope": "GLOBAL",
    "type": "textarea",
    "label": "Attendance: absence SMS",
    "group": "SMS",
    "dangerous": true,
    "placeholder": "Dear Parent, Your ward is absent for today's %s class at %s-%s. - 42 Learn.",
    "help": "Parent/guardian absence notice. Exactly three substitutions in order: course name, class start time, class end time. Match approved DLT text, punctuation and variable ordering (or approved {#var#} provider mapping).",
    "activation": "PROVIDER_TEMPLATE_MATCH_REQUIRED"
  },
  {
    "key": "sms.attendanceCorrectionTemplate",
    "scope": "GLOBAL",
    "type": "textarea",
    "label": "Attendance: correction SMS",
    "group": "SMS",
    "dangerous": true,
    "placeholder": "Dear Parent, Correction: your ward's absence for %s class at %s-%s has been reviewed and marked present. - 42 Learn.",
    "help": "Parent/guardian correction notice. Exactly three substitutions in order: course name, class start time, class end time; do not swap the order. Only the active Exotel/DLT-approved template will deliver.",
    "activation": "PROVIDER_TEMPLATE_MATCH_REQUIRED"
  },
  {
    "key": "sms.traiJobUpdateTemplate",
    "scope": "GLOBAL",
    "type": "textarea",
    "label": "Placements: job update SMS",
    "group": "SMS",
    "dangerous": true,
    "placeholder": "Reminder: Hello {#var#}, You have an update on the 42 LMS Jobs Portal. Login to 42lms.com to check - JRSPF",
    "help": "Job application status SMS sent to the registered recipient. The recipient name is the only approved {#var#} substitution. Text must be an exact match for the Exotel/DLT registered template.",
    "activation": "PROVIDER_TEMPLATE_MATCH_REQUIRED"
  },
  {
    "key": "course.watchedThresholdPercent",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Video 'watched' threshold (%)",
    "group": "Course & progress",
    "dangerous": false,
    "min": 1,
    "max": 100,
    "placeholder": "90",
    "help": "Global watched percentage, from 1 through 100. Stored setting alone does not change learner progress unless the authorized progress reader consumes the override.",
    "activation": "READER_VERIFICATION_REQUIRED"
  },
  {
    "key": "course.minInProgressPercent",
    "scope": "GLOBAL",
    "type": "int",
    "label": "'In progress' lower bound (%)",
    "group": "Course & progress",
    "dangerous": false,
    "min": 0,
    "max": 100,
    "placeholder": "5",
    "help": "Global percentage under which partially viewed work is Not started. Check the active progress calculation before changing this.",
    "activation": "READER_VERIFICATION_REQUIRED"
  },
  {
    "key": "ui.chatPollIntervalMs",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Classroom chat poll interval (ms)",
    "group": "Course & progress",
    "dangerous": false,
    "min": 3000,
    "max": 600000,
    "placeholder": "15000",
    "help": "Legacy poll interval 3000–600000 ms. VNext classroom chat uses its own polling mechanism; a stored override does not prove that it changes the running poller.",
    "activation": "STORED_ONLY"
  },
  {
    "key": "ui.progressSaveIntervalMs",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Video progress save interval (ms)",
    "group": "Course & progress",
    "dangerous": false,
    "min": 5000,
    "max": 600000,
    "placeholder": "15000",
    "help": "Legacy video progress save interval 5000–600000 ms. The running player must explicitly use the override; it is not a live toggle until verified.",
    "activation": "STORED_ONLY"
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
    "max": 1440,
    "help": "Overlap window and buffer are separate controls. Both must agree with the active interview scheduling service before operational use.",
    "activation": "READER_VERIFICATION_REQUIRED"
  },
  {
    "key": "interview.overlapBufferMinutes",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Interview buffer (minutes)",
    "group": "Placements",
    "dangerous": false,
    "min": 0,
    "max": 1440,
    "help": "Interview buffer must be nonnegative and used alongside overlapWindowMinutes; saving either setting is not proof of scheduling enforcement.",
    "activation": "READER_VERIFICATION_REQUIRED"
  },
  {
    "key": "interview.durationMinMinutes",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Interview minimum duration (minutes)",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 1440,
    "help": "Minimum interview duration must not exceed interview.durationMaxMinutes; validate both together before saving.",
    "activation": "READER_VERIFICATION_REQUIRED"
  },
  {
    "key": "interview.durationMaxMinutes",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Interview maximum duration (minutes)",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 1440,
    "help": "Maximum interview duration must be at least interview.durationMinMinutes; validate both together before saving.",
    "activation": "READER_VERIFICATION_REQUIRED"
  },
  {
    "key": "placement.applyRateLimitPerMinute",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Job application rate limit (per minute)",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 1000,
    "help": "Per-learner application rate limit. The active request limiter must consume this stored value before it takes effect.",
    "activation": "READER_VERIFICATION_REQUIRED"
  },
  {
    "key": "placement.staleAppliedDays",
    "scope": "GLOBAL",
    "type": "int",
    "label": "Stale application age (days)",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 365,
    "help": "Age of an untouched applied status before dashboard attention. Requires a consumer that reads this override.",
    "activation": "READER_VERIFICATION_REQUIRED"
  },
  {
    "key": "placement.closingSoonDays",
    "scope": "GLOBAL",
    "type": "int",
    "label": "'Closing soon' window (days)",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 365,
    "help": "Number of days before closing shown as Closing soon. Verify reporting/dashboard reader before assuming activation.",
    "activation": "READER_VERIFICATION_REQUIRED"
  },
  {
    "key": "placement.lowConversionThreshold",
    "scope": "GLOBAL",
    "type": "decimal",
    "label": "Low conversion threshold (0–1)",
    "group": "Placements",
    "dangerous": false,
    "min": 0,
    "max": 1,
    "placeholder": "0.15",
    "help": "Ratio between 0 and 1, not whole percent: 0.15 means 15%. Numeric precision must survive save and display.",
    "activation": "READER_VERIFICATION_REQUIRED"
  },
  {
    "key": "placement.needsAttentionSampleCap",
    "scope": "GLOBAL",
    "type": "int",
    "label": "'Needs attention' sample cap",
    "group": "Placements",
    "dangerous": false,
    "min": 1,
    "max": 1000,
    "help": "Upper bound on sampled attention results; a saved value alone does not reconfigure already-deployed reports.",
    "activation": "READER_VERIFICATION_REQUIRED"
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
 LEGACY_TENANT_SETTING_SPECS.map(spec=>[spec.key,spec] as const),
);
