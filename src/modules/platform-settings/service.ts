import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  attendancePolicies,
  colleges,
  placementCollegeRules,
  placementCompanyVisibilitySettings,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";

import {
  DEFAULT_ATTENDANCE_POLICY,
} from "@/modules/attendance/policy-validation";
import {
  TIMED_CONTENT_COMPLETION_THRESHOLD_PERCENT,
} from "@/modules/courses/progress-service";
import {
  DEFAULT_RULES,
  DEFAULT_VISIBILITY,
} from "@/modules/placements/tpo-policy-service";
import {
  ANNOUNCEMENT_LIMITS,
} from "@/modules/announcements/validation";
import {
  ATTEMPT_LIFETIME_SECONDS,
  EMAIL_RESEND_GAP_SECONDS,
  MAX_SENDS_PER_ADDRESS,
  MAX_SENDS_PER_CONTACT,
  MAX_SENDS_PER_CONTACT_TOTAL,
  SEND_WINDOW_MINUTES,
} from "@/modules/auth/login-service";
import {
  SESSION_MAX_AGE_SECONDS,
} from "@/modules/auth/config";
import {
  MAX_OUTBOUND_ATTEMPTS,
  outboundRetryDelayMs,
} from "@/modules/operations/outbound-delivery-policy";
import {
  OUTBOUND_CHANNELS,
  OUTBOUND_TEMPLATE_KEYS,
} from "@/modules/operations/outbound-delivery-contract";

import {
  buildPlatformSmsTemplateCatalog,
  collegePlatformSetting,
  fixedPlatformSetting,
  type PlatformSettingsSection,
} from "./model";

/**
 * A single read for the selected college. The outer service
 * enforces the central Super Admin permission before reading
 * anything; this query never accepts a college ID from a URL.
 */
async function readSelectedCollegeSettings(
  collegeId: string,
) {
  const [row] = await getDb()
    .select({
      collegeId: colleges.id,
      organizationId: colleges.organizationId,
      collegeName: colleges.name,

      attendancePolicyCollegeId:
        attendancePolicies.collegeId,
      eligibilityThresholdPercent:
        attendancePolicies.eligibilityThresholdPercent,
      correctionWindowHours:
        attendancePolicies.correctionWindowHours,

      placementRulesCollegeId:
        placementCollegeRules.collegeId,
      maxHeldOffers:
        placementCollegeRules.maxHeldOffers,
      upliftPct:
        placementCollegeRules.upliftPct,
      minResponseHours:
        placementCollegeRules.minResponseHours,

      visibilityCollegeId:
        placementCompanyVisibilitySettings.collegeId,
      showCgpaExact:
        placementCompanyVisibilitySettings.showCgpaExact,
      showTenthTwelfth:
        placementCompanyVisibilitySettings.showTenthTwelfth,
      showProjectLinks:
        placementCompanyVisibilitySettings.showProjectLinks,
      showAssessmentScores:
        placementCompanyVisibilitySettings.showAssessmentScores,
      showAttendance:
        placementCompanyVisibilitySettings.showAttendance,
    })
    .from(colleges)
    .leftJoin(
      attendancePolicies,
      eq(attendancePolicies.collegeId, colleges.id),
    )
    .leftJoin(
      placementCollegeRules,
      eq(placementCollegeRules.collegeId, colleges.id),
    )
    .leftJoin(
      placementCompanyVisibilitySettings,
      eq(
        placementCompanyVisibilitySettings.collegeId,
        colleges.id,
      ),
    )
    .where(
      and(
        eq(colleges.id, collegeId),
        eq(colleges.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new AuthorizationError("college.read");
  }

  return row;
}

/**
 * Read-only Super Admin inventory.
 *
 * Source constants are imported, not copied. Only fields from
 * an explicit non-secret allowlist are projected. No environment
 * lookup, application secrets, API keys, identity information,
 * contact details, auth tokens or raw settings blobs are read.
 *
 * Global Super Admin: sees fixed values and documented college
 * defaults, without assuming those defaults apply to all tenants.
 *
 * College-scoped Super Admin: sees the selected college's actual
 * persisted settings, falling back to the source defaults when
 * the optional policy row does not exist.
 */
export async function getSuperAdminPlatformSettings(
  context: RequestContext,
): Promise<{
  selectedCollegeName: string | null;
  sections: PlatformSettingsSection[];
}> {
  // This central permission is SUPER_ADMIN-only and, unlike
  // system-role.manage, remains usable with a selected college.
  requirePermission(context, "admin-scope.select");

  const collegeId =
    context.adminScope?.collegeId ?? null;

  const college = collegeId
    ? await readSelectedCollegeSettings(collegeId)
    : null;

  if (college) {
    requirePermission(context, "college.read", {
      collegeId: college.collegeId,
      organizationId: college.organizationId,
    });
  }

  const collegeSelected = college !== null;

  const attendance = (
    label: string,
    defaultValue: number,
    persistedValue: number | null,
    unit: string,
  ) =>
    collegePlatformSetting({
      label,
      defaultValue,
      persistedValue,
      collegeSelected,
      defaultSource:
        "src/modules/attendance/policy-validation.ts",
      persistedTable: "attendance_policies",
      unit,
    });

  const placementNumber = (
    label: string,
    defaultValue: number,
    persistedValue: number | null,
    unit: string,
  ) =>
    collegePlatformSetting({
      label,
      defaultValue,
      persistedValue,
      collegeSelected,
      defaultSource:
        "src/modules/placements/tpo-policy-service.ts",
      persistedTable: "placement_college_rules",
      unit,
    });

  const placementVisibility = (
    label: string,
    defaultValue: boolean,
    persistedValue: boolean | null,
  ) =>
    collegePlatformSetting({
      label,
      defaultValue,
      persistedValue,
      collegeSelected,
      defaultSource:
        "src/modules/placements/tpo-policy-service.ts",
      persistedTable:
        "placement_company_visibility_settings",
    });

  return {
    selectedCollegeName: college?.collegeName ?? null,
    sections: [
      {
        id: "course-progress",
        title: "Course & progress settings",
        description:
          "Fixed learner progress behavior used by the course module.",
        items: [
          fixedPlatformSetting(
            "Timed content completion threshold",
            TIMED_CONTENT_COMPLETION_THRESHOLD_PERCENT,
            "src/modules/courses/progress-service.ts",
            "%",
          ),
        ],
        note:
          "The threshold applies to VIDEO and YOUTUBE progress. " +
          "Legacy watched and in-progress thresholds are stored overrides with " +
          "reader verification required. Classroom polling (3000–600000ms) and " +
          "video progress saves (5000–600000ms) remain STORED_ONLY until a " +
          "runtime consumer is verified. Saving them does not change live timers.",
      },
      {
        id: "attendance",
        title: "Attendance settings",
        description:
          "College-specific attendance eligibility and correction policy.",
        items: [
          attendance(
            "Eligibility threshold",
            DEFAULT_ATTENDANCE_POLICY.eligibilityThresholdPercent,
            college?.attendancePolicyCollegeId
              ? college.eligibilityThresholdPercent
              : null,
            "%",
          ),
          attendance(
            "Attendance correction window",
            DEFAULT_ATTENDANCE_POLICY.correctionWindowHours,
            college?.attendancePolicyCollegeId
              ? college.correctionWindowHours
              : null,
            "hours",
          ),
        ],
        note:
          "A policy row is optional. Without one, the existing " +
          "attendance source defaults apply. This inventory does " +
          "not claim that the stored schedule.pastBookingGraceMinutes " +
          "(0–1440) takes effect; it has no verified scheduling consumer.",
      },
      {
        id: "placements",
        title: "Placement settings",
        description:
          "College placement rules and recruiter-visible field flags.",
        items: [
          placementNumber(
            "Maximum held offers",
            DEFAULT_RULES.maxHeldOffers,
            college?.placementRulesCollegeId
              ? college.maxHeldOffers
              : null,
            "offers",
          ),
          placementNumber(
            "Package uplift threshold",
            DEFAULT_RULES.upliftPct,
            college?.placementRulesCollegeId
              ? college.upliftPct
              : null,
            "%",
          ),
          placementNumber(
            "Minimum offer response window",
            DEFAULT_RULES.minResponseHours,
            college?.placementRulesCollegeId
              ? college.minResponseHours
              : null,
            "hours",
          ),
          placementVisibility(
            "Recruiters see exact CGPA",
            DEFAULT_VISIBILITY.showCgpaExact,
            college?.visibilityCollegeId
              ? college.showCgpaExact
              : null,
          ),
          placementVisibility(
            "Recruiters see board percentages",
            DEFAULT_VISIBILITY.showTenthTwelfth,
            college?.visibilityCollegeId
              ? college.showTenthTwelfth
              : null,
          ),
          placementVisibility(
            "Recruiters see project links",
            DEFAULT_VISIBILITY.showProjectLinks,
            college?.visibilityCollegeId
              ? college.showProjectLinks
              : null,
          ),
          placementVisibility(
            "Recruiters see assessment scores",
            DEFAULT_VISIBILITY.showAssessmentScores,
            college?.visibilityCollegeId
              ? college.showAssessmentScores
              : null,
          ),
          placementVisibility(
            "Recruiters see attendance",
            DEFAULT_VISIBILITY.showAttendance,
            college?.visibilityCollegeId
              ? college.showAttendance
              : null,
          ),
        ],
        note:
          "Placement rules and recruiter visibility are independent " +
          "per-college tables. Job-specific eligibility, interview " +
          "windows, rate limits and other placement workflow policies " +
          "are not summarized by this limited platform inventory.",
      },
      {
        id: "sms",
        title: "SMS & message templates",
        description:
          "Source-defined SMS OTP and draft outbound message intents. " +
          "All identifiers are non-secret labels; provider registration " +
          "and sender configuration are intentionally withheld.",
        items: [
          fixedPlatformSetting(
            "Shared queued outbound maximum attempts",
            MAX_OUTBOUND_ATTEMPTS,
            "src/modules/operations/outbound-delivery-policy.ts",
            "attempts",
          ),
          fixedPlatformSetting(
            "Queued outbound first retry delay",
            outboundRetryDelayMs(1) / 1000,
            "src/modules/operations/outbound-delivery-policy.ts",
            "seconds",
          ),
          fixedPlatformSetting(
            "Queued outbound second retry delay",
            outboundRetryDelayMs(2) / 1000,
            "src/modules/operations/outbound-delivery-policy.ts",
            "seconds",
          ),
        ],
        smsTemplates: buildPlatformSmsTemplateCatalog({
          outboundTemplateKeys: OUTBOUND_TEMPLATE_KEYS,
          outboundChannels: OUTBOUND_CHANNELS,
        }),
        note:
          "Exotel OTP SMS is implemented as a fixed source message: " +
          "provider acceptance is not recipient delivery, and its provider " +
          "does not use the draft outbound queue retry schedule. " +
          "The shared outbound policy supports exponential retry and " +
          "a five-attempt limit, but the DB10 queue/dispatcher has not " +
          "been migrated or activated. Invitation/reminder rows are " +
          "contract template keys, NOT operational SMS templates. " +
          "There is no verified registered attendance SMS template, " +
          "placement-notice SMS template or per-college SMS sender/template " +
          "override. The source-only TPO college SMS cap and editable " +
          "templates are not migrated and are NOT presented as persisted " +
          "values. Sender credentials, provider template IDs, DLT values, " +
          "phone numbers and environment configuration are never queried " +
          "or displayed.",
      },
      {
        id: "operations",
        title: "Operational caps",
        description:
          "Selected fixed source limits for identity, announcements and outbound delivery.",
        items: [
          fixedPlatformSetting(
            "Login challenge lifetime",
            ATTEMPT_LIFETIME_SECONDS,
            "src/modules/auth/login-service.ts",
            "seconds",
          ),
          fixedPlatformSetting(
            "Login send budget window",
            SEND_WINDOW_MINUTES,
            "src/modules/auth/login-service.ts",
            "minutes",
          ),
          fixedPlatformSetting(
            "Login sends per contact and address",
            MAX_SENDS_PER_CONTACT,
            "src/modules/auth/login-service.ts",
          ),
          fixedPlatformSetting(
            "Login sends per contact",
            MAX_SENDS_PER_CONTACT_TOTAL,
            "src/modules/auth/login-service.ts",
          ),
          fixedPlatformSetting(
            "Login sends per address",
            MAX_SENDS_PER_ADDRESS,
            "src/modules/auth/login-service.ts",
          ),
          fixedPlatformSetting(
            "Email code resend gap",
            EMAIL_RESEND_GAP_SECONDS,
            "src/modules/auth/login-service.ts",
            "seconds",
          ),
          fixedPlatformSetting(
            "Maximum session age",
            SESSION_MAX_AGE_SECONDS,
            "src/modules/auth/config.ts",
            "seconds",
          ),
          fixedPlatformSetting(
            "Maximum outbound delivery attempts",
            MAX_OUTBOUND_ATTEMPTS,
            "src/modules/operations/outbound-delivery-policy.ts",
          ),
          fixedPlatformSetting(
            "Announcement title length limit",
            ANNOUNCEMENT_LIMITS.titleCharacters,
            "src/modules/announcements/validation.ts",
            "characters",
          ),
          fixedPlatformSetting(
            "Announcement message length limit",
            ANNOUNCEMENT_LIMITS.messageCharacters,
            "src/modules/announcements/validation.ts",
            "characters",
          ),
          fixedPlatformSetting(
            "Announcement list default page size",
            ANNOUNCEMENT_LIMITS.defaultPageSize,
            "src/modules/announcements/validation.ts",
            "items",
          ),
          fixedPlatformSetting(
            "Announcement list maximum page size",
            ANNOUNCEMENT_LIMITS.maximumPageSize,
            "src/modules/announcements/validation.ts",
            "items",
          ),
        ],
        note:
          "These are selected source-defined bounds, not a claim " +
          "that every subsystem is active or globally configurable. " +
          "Bulk-upload caps and nonconstant per-endpoint rate limits " +
          "have not been established as registered platform settings. " +
          "No runtime environment configuration is inspected.",
      },
    ],
  };
}

/** Actual runtime-wiring status of saved legacy overrides. This is intentionally
 * separate from a persisted value: a successful PATCH must never claim that
 * authentication, Exotel, scheduling or browser timers have changed.
 */
export const PLATFORM_OVERRIDE_RUNTIME_CONSUMERS = {
  "course.watchedThresholdPercent": {
    state:"READER_VERIFICATION_REQUIRED",reader:"Learner playback/progress threshold",
  },
  "course.minInProgressPercent": {
    state:"READER_VERIFICATION_REQUIRED",reader:"Learner course progress categorization",
  },
  "ui.chatPollIntervalMs": {
    state:"STORED_ONLY",reader:"Classroom chat client has no proven override read",
  },
  "ui.progressSaveIntervalMs": {
    state:"STORED_ONLY",reader:"Learner video progress save client has no proven override read",
  },
  "schedule.pastBookingGraceMinutes": {
    state:"STORED_ONLY",reader:"Scheduling policy uses separate source and membership guards",
  },
  "sms.senderId": {
    state:"DEPLOYMENT_REQUIRED",reader:"Exotel sender registration and deployment configuration",
  },
  "sms.attendanceAbsenceTemplate": {
    state:"PROVIDER_TEMPLATE_MATCH_REQUIRED",reader:"Parent SMS via approved Exotel/DLT body",
  },
  "sms.attendanceCorrectionTemplate": {
    state:"PROVIDER_TEMPLATE_MATCH_REQUIRED",reader:"Corrected attendance SMS via approved Exotel/DLT body",
  },
  "sms.traiJobUpdateTemplate": {
    state:"PROVIDER_TEMPLATE_MATCH_REQUIRED",reader:"Job-update SMS via registered Exotel/DLT body",
  },
} as const;
export function describePlatformOverrideConsumer(key:string) {
  return PLATFORM_OVERRIDE_RUNTIME_CONSUMERS[key as keyof typeof PLATFORM_OVERRIDE_RUNTIME_CONSUMERS] ??
    {state:"READER_VERIFICATION_REQUIRED" as const,reader:"Operational consumer must be verified before activation"};
}
