import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { departments } from "./departments";
import { courses } from "./courses";
import { users } from "./users";
import { placementDriveChangeRequests } from "./placement-drive-change-requests";
import {
  placementApplications,
  placementJobs,
  placementRecruiterProfiles,
} from "./placements";

/**
 * W05 / DB09 collaboration persistence.
 *
 * Registered by migration 0075 (tenant-scoped composite FKs generated here;
 * principal/lifecycle guard triggers are hand-appended in the SQL).
 */
export const placementTpoMessageThreads = pgTable(
  "placement_tpo_message_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    recruiterUserId: uuid("recruiter_user_id")
      .notNull()
      .references(() => placementRecruiterProfiles.userId, {
        onDelete: "restrict",
      }),
    jobId: uuid("job_id"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    /** Store a keyed digest only; no raw inbound email bearer token. */
    replyTokenHash: varchar("reply_token_hash", { length: 64 }),
    recruiterEmailedAt: timestamp("recruiter_emailed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_tpo_message_threads_general_uq")
      .on(table.collegeId, table.recruiterUserId)
      .where(sql`${table.jobId} is null`),
    uniqueIndex("placement_tpo_message_threads_job_uq")
      .on(table.collegeId, table.recruiterUserId, table.jobId)
      .where(sql`${table.jobId} is not null`),
    uniqueIndex("placement_tpo_message_threads_reply_token_uq")
      .on(table.replyTokenHash).where(sql`${table.replyTokenHash} is not null`),
    check("placement_tpo_message_threads_reply_token_ck",
      sql`${table.replyTokenHash} is null or ${table.replyTokenHash} ~ '^[0-9a-f]{64}$'`),
    index("placement_tpo_message_threads_college_last_idx").on(
      table.collegeId,
      table.lastMessageAt,
    ),
    foreignKey({
      name: "db09_thread_job_scope_fk",
      columns: [table.jobId, table.collegeId],
      foreignColumns: [placementJobs.id, placementJobs.collegeId],
    }).onDelete("restrict"),
  ],
);

export const placementTpoMessages = pgTable(
  "placement_tpo_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => placementTpoMessageThreads.id, {
        onDelete: "restrict",
      }),
    senderType: varchar("sender_type", { length: 10 }).notNull(),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    kind: varchar("kind", { length: 16 }).notNull().default("MESSAGE"),
    event: varchar("event", { length: 80 }),
    /** The DB09 request/thread job relationship is checked by the 0304
     * same-job trigger. A request from another college must never be quoted
     * as a valid event in this recruiter conversation. */
    changeRequestId: uuid("change_request_id")
      .references(() => placementDriveChangeRequests.id, { onDelete: "restrict" }),
    via: varchar("via", { length: 12 }).notNull().default("APP"),
    /** Registered 0135 email bridge channel, distinct from via. */
    deliveryChannel: varchar("delivery_channel", { length: 8 }).notNull().default("APP"),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("placement_tpo_messages_thread_created_idx").on(
      table.threadId,
      table.createdAt,
    ),
    index("placement_tpo_messages_change_request_idx").on(table.changeRequestId, table.createdAt),
    check("placement_tpo_messages_kind_ck", sql`${table.kind} in ('MESSAGE','EVENT')`),
    check("placement_tpo_messages_via_ck", sql`${table.via} in ('APP','EMAIL')`),
    check("placement_tpo_messages_delivery_ck",
      sql`${table.deliveryChannel} in ('APP','EMAIL')`),
    check("placement_tpo_messages_event_shape_ck",
      sql`${table.kind} <> 'EVENT' or (${table.event} is not null and ${table.changeRequestId} is not null)`),
    check(
      "placement_tpo_messages_sender_ck",
      sql`${table.senderType} in ('TPO', 'RECRUITER')`,
    ),
    check(
      "placement_tpo_messages_body_ck",
      sql`length(trim(${table.body})) between 1 and 4000`,
    ),
  ],
);

export const placementTpoShareLinks = pgTable(
  "placement_tpo_share_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    jobId: uuid("job_id").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    recipientEmail: varchar("recipient_email", { length: 320 }).notNull(),
    codeHash: varchar("code_hash", { length: 64 }),
    emailCodeHash: varchar("email_code_hash", { length: 64 }),
    emailCodeExpiresAt: timestamp("email_code_expires_at", {
      withTimezone: true,
    }),
    columns: jsonb("columns"),
    maxStage: varchar("max_stage", { length: 30 }),
    shortlistBy: timestamp("shortlist_by", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_tpo_share_links_token_uq").on(table.tokenHash),
    foreignKey({
      name: "db09_share_job_scope_fk",
      columns: [table.jobId, table.collegeId],
      foreignColumns: [placementJobs.id, placementJobs.collegeId],
    }).onDelete("restrict"),
    index("placement_tpo_share_links_job_created_idx").on(
      table.jobId,
      table.createdAt,
    ),
    index("placement_tpo_share_links_college_created_idx").on(
      table.collegeId,
      table.createdAt,
    ),
    check(
      "placement_tpo_share_links_token_hash_ck",
      sql`${table.tokenHash} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "placement_tpo_share_links_code_hash_ck",
      sql`${table.codeHash} is null or ${table.codeHash} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "placement_tpo_share_links_email_code_hash_ck",
      sql`${table.emailCodeHash} is null or ${table.emailCodeHash} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "placement_tpo_share_links_expiry_ck",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "placement_tpo_share_links_email_code_shape_ck",
      sql`(${table.emailCodeHash} is null and ${table.emailCodeExpiresAt} is null)
        or (${table.emailCodeHash} is not null and ${table.emailCodeExpiresAt} is not null)`,
    ),
    check(
      "placement_tpo_share_links_recipient_email_ck",
      sql`${table.recipientEmail} = lower(trim(${table.recipientEmail}))
        and position('@' in ${table.recipientEmail}) > 1`,
    ),
    check(
      "placement_tpo_share_links_columns_ck",
      sql`${table.columns} is null
        or (
          jsonb_typeof(${table.columns}) = 'array'
          and ${table.columns} <@
            '["name","roll","branch","cgpa","tenth","twelfth","email","phone","resume","projects","skillMatch","stage"]'::jsonb
        )`,
    ),
    check(
      "placement_tpo_share_links_max_stage_ck",
      sql`${table.maxStage} is null
        or ${table.maxStage} in (
          'APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','OFFERED','HIRED'
        )`,
    ),
    check(
      "placement_tpo_share_links_revocation_ck",
      sql`${table.revokedAt} is null or ${table.revokedAt} >= ${table.createdAt}`,
    ),
    check(
      "placement_tpo_share_links_email_code_expiry_ck",
      sql`${table.emailCodeExpiresAt} is null
        or ${table.emailCodeExpiresAt} > ${table.createdAt}`,
    ),
  ],
);

export const placementTpoShareEvents = pgTable(
  "placement_tpo_share_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shareId: uuid("share_id")
      .notNull()
      .references(() => placementTpoShareLinks.id, {
        onDelete: "restrict",
      }),
    action: varchar("action", { length: 24 }).notNull(),
    detail: varchar("detail", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("placement_tpo_share_events_action_time_idx").on(table.action, table.createdAt),
    index("placement_tpo_share_events_share_created_idx").on(
      table.shareId,
      table.createdAt,
    ),
    uniqueIndex("db09_share_events_created_uq")
      .on(table.shareId)
      .where(sql`${table.action} = 'CREATED'`),
    uniqueIndex("db09_share_events_revoked_uq")
      .on(table.shareId)
      .where(sql`${table.action} = 'REVOKED'`),
    check(
      "placement_tpo_share_events_action_ck",
      sql`${table.action} in ('CREATED','OPENED','DOWNLOADED_LIST','DOWNLOADED_ZIP','REVOKED','LINK_EMAILED','CODE_EMAILED')`,
    ),
  ],
);

export const placementTpoCollegeSettings = pgTable(
  "placement_tpo_college_settings",
  {
    collegeId: uuid("college_id")
      .primaryKey()
      .references(() => colleges.id, { onDelete: "restrict" }),
    inviteEmailTemplate: text("invite_email_template"),
    reminderEmailTemplate: text("reminder_email_template"),
    whatsappTemplate: text("whatsapp_template"),
    studentEmailWording: text("student_email_wording"),
    smsMonthlyCap: integer("sms_monthly_cap").notNull().default(500),
    emailSignature: text("email_signature"),
    logoObjectPath: text("logo_object_path"),
    prepThresholdPct: integer("prep_threshold_pct").notNull().default(60),
    // DB-036: four fixed legacy optional-external-delivery switches.
    // APP notifications remain visible regardless of these values. All default on.
    notifyDriveOpenEmail: boolean("notify_drive_open_email").notNull().default(true),
    notifyResultApplied: boolean("notify_result_applied").notNull().default(true),
    notifyNudges: boolean("notify_nudges").notNull().default(true),
    notifyPrepAssigned: boolean("notify_prep_assigned").notNull().default(true),
    jobTypes: jsonb("job_types"),
    outcomeLabels: jsonb("outcome_labels"),
    recruiterAccessMonths: integer("recruiter_access_months")
      .notNull()
      .default(6),
    recruiterDriveNeedsApproval: boolean("recruiter_drive_needs_approval")
      .notNull()
      .default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "placement_tpo_college_settings_bounds_ck",
      sql`${table.smsMonthlyCap} >= 0
        and ${table.prepThresholdPct} between 0 and 100
        and ${table.recruiterAccessMonths} between 0 and 60`,
    ),
    check(
      "placement_tpo_college_settings_job_types_ck",
      sql`${table.jobTypes} is null or jsonb_typeof(${table.jobTypes}) = 'object'`,
    ),
    check(
      "placement_tpo_college_settings_outcome_labels_ck",
      sql`${table.outcomeLabels} is null or jsonb_typeof(${table.outcomeLabels}) = 'array'`,
    ),
  ],
);

/**
 * DB-034: legacy trusted_domains_json normalized into one company-domain row.
 * The DB stores only the already-normalized domain, never "@domain" aliases.
 */
export const placementTpoTrustedDomains = pgTable(
  "placement_tpo_trusted_domains",
  {
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    domain: varchar("domain", { length: 253 }).notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "placement_tpo_trusted_domains_pk",
      columns: [table.collegeId, table.domain],
    }),
    index("placement_tpo_trusted_domains_domain_idx").on(table.domain),
    check(
      "placement_tpo_trusted_domains_shape_ck",
      sql`${table.domain} = lower(${table.domain})
        and ${table.domain} = trim(${table.domain})
        and ${table.domain} ~ '^[a-z0-9.-]+[.][a-z]{2,}$'
`,
    ),
    check(
      "placement_tpo_trusted_domains_free_mail_ck",
      sql`${table.domain} not in (
        'gmail.com','googlemail.com',
        'yahoo.com','yahoo.co.in','yahoo.in','ymail.com',
        'outlook.com','outlook.in','hotmail.com','live.com','msn.com',
        'icloud.com','me.com','aol.com','rediffmail.com',
        'protonmail.com','proton.me',
        'zohomail.com','zohomail.in','mail.com','gmx.com','yandex.com'
      )`,
    ),
  ],
);

/**
 * DB-034: legacy prep_course_ids_json normalized to FK-backed rows.
 * Legacy exposed organization-owned courses to each college, so vNext allows a
 * prep course from any active department/college in the same organization.
 * The supplemental DB09 SQL enforces that organization boundary and TPO actor.
 */
export const placementTpoPrepCourses = pgTable(
  "placement_tpo_prep_courses",
  {
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "placement_tpo_prep_courses_pk",
      columns: [table.collegeId, table.courseId],
    }),
    index("placement_tpo_prep_courses_course_idx").on(table.courseId),
  ],
);

export const placementTpoUserPreferences = pgTable(
  "placement_tpo_user_preferences",
  {
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    // DB-036: source-fixed persisted TPO preference API state; default digest
    // off, others on. Current rendered UI use and delivery consumption are unproven.
    morningDigest: boolean("morning_digest").notNull().default(false),
    recruiterMessages: boolean("recruiter_messages").notNull().default(true),
    requests: boolean("requests").notNull().default(true),
    resultsReady: boolean("results_ready").notNull().default(true),
    followUps: boolean("follow_ups").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "placement_tpo_user_preferences_pk",
      columns: [table.collegeId, table.userId],
    }),
  ],
);

export const placementTpoSavedViews = pgTable(
  "placement_tpo_saved_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    scope: varchar("scope", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    filters: jsonb("filters"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("placement_tpo_saved_views_owner_scope_idx").on(
      table.collegeId,
      table.userId,
      table.scope,
    ),
    check(
      "placement_tpo_saved_views_scope_ck",
      sql`${table.scope} in (
        'STUDENTS',
        'RECRUITER_LEADS',
        'DRIVES',
        'APPLICANTS',
        'BATCH_STUDENTS',
        'OFFERS',
        'REQUESTS',
        'AUDIT',
        'REPORT',
        'VERIFICATION',
        'RESULTS',
        'COMPANY_DRIVES'
      )`,
    ),
    check(
      "placement_tpo_saved_views_name_ck",
      sql`length(trim(${table.name})) between 1 and 100`,
    ),
  ],
);

export const placementTpoStudentNotes = pgTable(
  "placement_tpo_student_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    learnerMembershipId: uuid("learner_membership_id").notNull(),
    note: text("note").notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("placement_tpo_student_notes_learner_created_idx").on(
      table.learnerMembershipId,
      table.createdAt,
    ),
    foreignKey({
      name: "db09_note_member_scope_fk",
      columns: [table.learnerMembershipId, table.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    check(
      "placement_tpo_student_notes_note_ck",
      sql`length(trim(${table.note})) between 1 and 2000`,
    ),
  ],
);

export const placementTpoTeamMembers = pgTable(
  "placement_tpo_team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id").notNull(),
    role: varchar("role", { length: 32 }).notNull(),
    departmentId: uuid("department_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_tpo_team_members_college_membership_uq").on(
      table.collegeId,
      table.membershipId,
    ),
    foreignKey({
      name: "db09_team_member_scope_fk",
      columns: [table.membershipId, table.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    foreignKey({
      name: "db09_team_department_scope_fk",
      columns: [table.departmentId, table.collegeId],
      foreignColumns: [departments.id, departments.collegeId],
    }).onDelete("restrict"),
    check(
      "placement_tpo_team_members_role_ck",
      sql`${table.role} in ('TPO_ADMIN','FACULTY_COORDINATOR')`,
    ),
    check(
      "placement_tpo_team_members_department_ck",
      sql`(${table.role} = 'TPO_ADMIN' and ${table.departmentId} is null)
        or (${table.role} = 'FACULTY_COORDINATOR' and ${table.departmentId} is not null)`,
    ),
  ],
);

export const placementRecruiterApplicantNotes = pgTable(
  "placement_recruiter_applicant_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recruiterUserId: uuid("recruiter_user_id")
      .notNull()
      .references(() => placementRecruiterProfiles.userId, {
        onDelete: "restrict",
      }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    jobId: uuid("job_id").notNull(),
    applicationId: uuid("application_id").notNull(),
    rating: integer("rating"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_recruiter_applicant_notes_owner_application_uq").on(
      table.recruiterUserId,
      table.applicationId,
    ),
    index("placement_recruiter_applicant_notes_owner_job_idx").on(
      table.recruiterUserId,
      table.jobId,
    ),
    foreignKey({
      name: "db09_recruiter_note_job_scope_fk",
      columns: [table.jobId, table.collegeId],
      foreignColumns: [placementJobs.id, placementJobs.collegeId],
    }).onDelete("restrict"),
    foreignKey({
      name: "db09_recruiter_note_application_job_fk",
      columns: [table.applicationId, table.jobId],
      foreignColumns: [placementApplications.id, placementApplications.jobId],
    }).onDelete("restrict"),
    check(
      "placement_recruiter_applicant_notes_rating_ck",
      sql`${table.rating} is null or ${table.rating} between 1 and 5`,
    ),
    check(
      "placement_recruiter_applicant_notes_content_ck",
      sql`${table.rating} is not null or length(trim(coalesce(${table.note}, ''))) > 0`,
    ),
    check(
      "placement_recruiter_applicant_notes_note_ck",
      sql`${table.note} is null or length(${table.note}) <= 1000`,
    ),
  ],
);

export const placementRecruiterNotificationReads = pgTable(
  "placement_recruiter_notification_reads",
  {
    recruiterUserId: uuid("recruiter_user_id")
      .notNull()
      .references(() => placementRecruiterProfiles.userId, {
        onDelete: "restrict",
      }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    readThrough: timestamp("read_through", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "placement_recruiter_notification_reads_pk",
      columns: [table.recruiterUserId, table.collegeId],
    }),
  ],
);

/**
 * College-scoped legacy TPO settings crosswalk. Notification switches must
 * retain their own booleans (including false); blocked calendar dates belong
 * in availability tables, not settings JSON. Job types keep source keys and
 * display labels to avoid rewriting historical company/application records.
 */
export const LEGACY_TPO_SETTINGS_FIELDS = {
  inviteEmailTemplate: "inviteEmailTemplate",
  reminderEmailTemplate: "reminderEmailTemplate",
  whatsappTemplate: "whatsappTemplate",
  studentEmailWording: "studentEmailWording",
  smsMonthlyCap: "smsMonthlyCap",
  emailSignature: "emailSignature",
  logoObjectPath: "logoObjectPath",
  prepThresholdPct: "prepThresholdPct",
  notifyDriveOpenEmail: "notifyDriveOpenEmail",
  notifyResultApplied: "notifyResultApplied",
  notifyNudges: "notifyNudges",
  notifyPrepAssigned: "notifyPrepAssigned",
  jobTypes: "jobTypes",
  outcomeLabels: "outcomeLabels",
  recruiterAccessMonths: "recruiterAccessMonths",
  recruiterDriveNeedsApproval: "recruiterDriveNeedsApproval",
} as const;

/** Blocked-day migration must preserve date-only ISO values without UTC shifts. */
export function parseLegacyTpoBlockedDate(value: string): string | null {
  const match = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day
    ? value.trim() : null;
}
