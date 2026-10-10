import { sql } from "drizzle-orm";
import {
  check,
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
import { departments } from "./academics";
import { users } from "./users";
import {
  placementApplications,
  placementJobs,
  placementRecruiterProfiles,
} from "./placements";

/**
 * W05 / DB09 collaboration persistence.
 *
 * IMPORTANT: these tables are source-authored but UNREGISTERED until W01
 * adds them to the shared schema barrel, generates the canonical Drizzle
 * migration/snapshot and replays them against disposable PostgreSQL.
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
    jobId: uuid("job_id").references(() => placementJobs.id, {
      onDelete: "restrict",
    }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
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
    index("placement_tpo_message_threads_college_last_idx").on(
      table.collegeId,
      table.lastMessageAt,
    ),
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
    check(
      "placement_tpo_messages_sender_ck",
      sql`${table.senderType} in ('TPO', 'HR')`,
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
    jobId: uuid("job_id")
      .notNull()
      .references(() => placementJobs.id, { onDelete: "restrict" }),
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
    index("placement_tpo_share_events_share_created_idx").on(
      table.shareId,
      table.createdAt,
    ),
    check(
      "placement_tpo_share_events_action_ck",
      sql`${table.action} in ('CREATED','OPENED','DOWNLOADED_LIST','DOWNLOADED_ZIP','REVOKED')`,
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
    trustedDomains: jsonb("trusted_domains"),
    prepCourseIds: jsonb("prep_course_ids"),
    prepThresholdPct: integer("prep_threshold_pct").notNull().default(60),
    notifyToggles: jsonb("notify_toggles"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "placement_tpo_college_settings_bounds_ck",
      sql`${table.smsMonthlyCap} >= 0 and ${table.prepThresholdPct} between 0 and 100`,
    ),
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
    preferences: jsonb("preferences"),
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
      sql`${table.scope} in ('STUDENTS','LEADS','DRIVES')`,
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
    learnerMembershipId: uuid("learner_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
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
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    role: varchar("role", { length: 32 }).notNull(),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_tpo_team_members_college_membership_uq").on(
      table.collegeId,
      table.membershipId,
    ),
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
    jobId: uuid("job_id")
      .notNull()
      .references(() => placementJobs.id, { onDelete: "restrict" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => placementApplications.id, {
        onDelete: "restrict",
      }),
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
