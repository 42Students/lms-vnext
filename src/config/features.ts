import { readEnv, type EnvName } from "./env";

/**
 * Deployment readiness and harness switches, each defined once.
 *
 * A "ready" flag means: this code path's migrations and checks have been verified in this deployment, so the code may serve it.
 * Each flag has its own expected value (a historic mix of "VERIFIED", "DB09_VERIFIED", "true" and so on); this table is the only
 * place that value is written, so call sites say `featureReady("tpoApi")` and cannot mistype or invert the comparison.
 *
 * This is NOT per-college entitlement: whether a particular college may use a module is answered by module access
 * (src/modules/module-access). A feature here answers "is it deployed and verified".
 */
export type FeatureDefinition = {
  /** The environment variable that carries the switch. */
  flag: EnvName;
  /** The exact value that turns the feature on. Anything else (including unset) is off. */
  on: string;
  /** Where the feature lives, for operators. */
  area: "placements" | "notifications" | "courses" | "profile" | "projects" | "skills" | "platform" | "harness";
  /** Harness switches enable test tooling: they must never be on in a production deployment. */
  harness?: true;
};

export const FEATURES = {
  // placements
  tpoApi: { flag: "DB09_TPO_API_READY", on: "DB09_VERIFIED", area: "placements" },
  publicJoinTrustedProxy: { flag: "PUBLIC_JOIN_TRUSTED_PROXY_READY", on: "VERIFIED", area: "platform" },
  tpoRecruiterOtp: { flag: "TPO_RECRUITER_OTP_READY", on: "VERIFIED", area: "placements" },
  tpoRecruiterOtpDelivery: { flag: "TPO_RECRUITER_OTP_DELIVERY_READY", on: "VERIFIED", area: "placements" },
  tpoRecruiterInviteEmail: { flag: "TPO_RECRUITER_INVITE_EMAIL_READY", on: "VERIFIED", area: "placements" },
  tpoRecruiterReminder: { flag: "TPO_RECRUITER_REMINDER_READY", on: "VERIFIED", area: "placements" },
  tpoInterviewEmail: { flag: "TPO_INTERVIEW_EMAIL_READY", on: "VERIFIED", area: "placements" },
  tpoCampaigns: { flag: "TPO_CAMPAIGNS_READY", on: "VERIFIED", area: "placements" },
  tpoDeadlineToday: { flag: "TPO_DEADLINE_TODAY_READY", on: "VERIFIED", area: "placements" },
  tpoScheduledOfferExpiry: { flag: "TPO_SCHEDULED_OFFER_EXPIRY_ENABLED", on: "true", area: "placements" },
  tpoScheduledOfferReminders: { flag: "TPO_SCHEDULED_OFFER_REMINDERS_ENABLED", on: "true", area: "placements" },
  diversityOutreach: { flag: "DB10_DIVERSITY_OUTREACH_READY", on: "PRIVACY_APPROVED", area: "placements" },
  // notifications and messaging
  notificationOutbox: { flag: "DB10_NOTIFICATION_OUTBOX_READY", on: "DB10_VERIFIED", area: "notifications" },
  notificationScheduler: { flag: "DB10_NOTIFICATION_SCHEDULER_READY", on: "DB10_VERIFIED", area: "notifications" },
  announcements: { flag: "DB10_ANNOUNCEMENTS_READY", on: "DB10_VERIFIED", area: "notifications" },
  outbound: { flag: "DB10_OUTBOUND_READY", on: "DB10_VERIFIED", area: "notifications" },
  outboundDispatch: { flag: "DB10_OUTBOUND_DISPATCH_READY", on: "DB10_VERIFIED", area: "notifications" },
  mentorProjectEmailOutbox: { flag: "MENTOR_PROJECT_EMAIL_OUTBOX_READY", on: "verified", area: "projects" },
  logAlerts: { flag: "DB10_LOG_ALERTS_READY", on: "DB10_VERIFIED", area: "platform" },
  logAlertCloudPoll: { flag: "LOG_ALERT_CLOUD_POLL_ENABLED", on: "true", area: "platform" },
  auditFindings: { flag: "DB10_AUDIT_FINDINGS_READY", on: "DB10_VERIFIED", area: "platform" },
  auditFindingsLedger: { flag: "DB10_AUDIT_FINDINGS_LEDGER_READY", on: "LEDGER_VERIFIED", area: "platform" },
  tracker: { flag: "DB10_TRACKER_READY", on: "DB10_VERIFIED", area: "platform" },
  publicIssueCatalog: { flag: "PUBLIC_ISSUE_CATALOG_READY", on: "true", area: "platform" },
  tenantManagedWildcard: { flag: "TENANT_MANAGED_WILDCARD_READY", on: "true", area: "platform" },
  // courses and grading
  gradeHistory: { flag: "DB045_GRADE_HISTORY_READY", on: "DB045_VERIFIED", area: "courses" },
  gradeProducers: { flag: "DB045_GRADE_PRODUCERS_READY", on: "DB045_VERIFIED", area: "courses" },
  gradeReplay: { flag: "DB045_GRADE_REPLAY_READY", on: "DB045_VERIFIED", area: "courses" },
  contentOrder: { flag: "DB05_CONTENT_ORDER_READY", on: "DB05_VERIFIED", area: "courses" },
  courseDisplay: { flag: "DB05_COURSE_DISPLAY_READY", on: "DB05_VERIFIED", area: "courses" },
  lessonDiscussions: { flag: "DB05_LESSON_DISCUSSIONS_READY", on: "DB05_VERIFIED", area: "courses" },
  resourceMaterials: { flag: "DB05_RESOURCE_MATERIALS_READY", on: "DB05_VERIFIED", area: "courses" },
  // profile and skills
  profileGallery: { flag: "DB04_PROFILE_GALLERY_READY", on: "DB04_VERIFIED", area: "profile" },
  skills: { flag: "DB10_SKILLS_READY", on: "DB10_VERIFIED", area: "skills" },
  skillsSchema: { flag: "DB10_SKILLS_SCHEMA_READY", on: "DB10_REPLAY_VERIFIED", area: "skills" },
  skillsSynonyms: { flag: "DB10_SKILLS_SYNONYMS_READY", on: "SEED_VERIFIED", area: "skills" },
  // test harness (never on in production)
  e2eAuth: { flag: "E2E_AUTH_ENABLED", on: "true", area: "harness", harness: true },
  e2eSeed: { flag: "E2E_SEED_ENABLED", on: "true", area: "harness", harness: true },
  appE2eSeed: { flag: "APP_E2E_SEED_ENABLED", on: "true", area: "harness", harness: true },
} as const satisfies Record<string, FeatureDefinition>;

export type FeatureKey = keyof typeof FEATURES;
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

/** True only when the feature's variable holds exactly its expected value. Read live, so tests can switch it. */
export function featureReady(key: FeatureKey): boolean {
  const definition: FeatureDefinition = FEATURES[key];
  return readEnv(definition.flag) === definition.on;
}

export function featureFlagName(key: FeatureKey): EnvName {
  return FEATURES[key].flag;
}
