/**
 * DB10 bug tracker relational schema DRAFT ONLY.
 * Unregistered by src/db/schema/index.ts and not migrated until DB03/DB04
 * finish shared Drizzle migration generation. No production data migration.
 * Legacy V151-V154 + BugReport/Activity/Attachment/Access JPA entities.
 * Deliberate security redesign: private objects, immutable activity,
 * restrictive deletion, hashed sessions and authenticated actors.
 */
import { sql } from "drizzle-orm";
import {
  bigint, boolean, check, index, integer, pgTable, text, timestamp,
  uniqueIndex, uuid, varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { colleges } from "./colleges";

export const db10BugTrackerAccess = pgTable("bug_tracker_access", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  legacyReporterAccessId: integer("legacy_reporter_access_id"),
  /** Stable signed-in subject, not an externally issued reporter token. */
  subjectUserId: uuid("subject_user_id").references(()=>users.id,{onDelete:"restrict"}),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  accessRole: varchar("access_role", { length: 24 }).notNull().default("REPORTER"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("db10_tracker_access_hash_uq").on(t.tokenHash),
  uniqueIndex("db10_tracker_access_subject_user_uq").on(t.subjectUserId)
    .where(sql`${t.subjectUserId} is not null`),
  uniqueIndex("db10_tracker_access_legacy_uq").on(t.legacyReporterAccessId)
    .where(sql`${t.legacyReporterAccessId} is not null`),
  index("db10_tracker_access_name_active_idx").on(sql`lower(${t.displayName})`,t.active),
  index("db10_tracker_access_role_active_idx").on(t.active, t.accessRole),
  check("db10_tracker_access_role_ck",
    sql.raw('"access_role" in (\'REPORTER\',\'MANAGER\')')),
  check("db10_tracker_access_hash_ck",
    sql.raw('"token_hash" ~ \'^[0-9a-f]{64}$\'')),
]);

export const db10BugTrackerSessions = pgTable("bug_tracker_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  accessId: uuid("access_id").notNull()
    .references(() => db10BugTrackerAccess.id, { onDelete: "restrict" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("db10_tracker_sessions_hash_uq").on(t.tokenHash),
  index("db10_tracker_sessions_access_expiry_idx").on(t.accessId, t.expiresAt),
  index("db10_tracker_sessions_expiry_idx").on(t.expiresAt),
  check("db10_tracker_sessions_hash_ck",
    sql.raw('"token_hash" ~ \'^[0-9a-f]{64}$\'')),
  check("db10_tracker_sessions_revoke_ck",
    sql.raw('"revoked_at" is null or "revoked_at" >= "created_at"')),
]);

export const db10BugReports = pgTable("bug_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: varchar("public_id", { length: 24 }).notNull(),
  legacyReportId: bigint("legacy_report_id",{mode:"bigint"}),
  reporterAccessId: uuid("reporter_access_id").notNull()
    .references(() => db10BugTrackerAccess.id, { onDelete: "restrict" }),
  reporterUserId: uuid("reporter_user_id").references(() => users.id,{onDelete:"restrict"}),
  collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "restrict" }),
  reporterName: varchar("reporter_name", { length: 120 }).notNull(),
  accountRole: varchar("account_role", { length: 32 }).notNull(),
  environment: varchar("environment", { length: 32 }).notNull(),
  page: varchar("page", { length: 120 }).notNull(),
  screen: varchar("screen", { length: 120 }),
  section: varchar("section", { length: 120 }),
  issueType: varchar("issue_type", { length: 80 }).notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 32 }).notNull(),
  evidenceLink: varchar("evidence_link", { length: 1000 }),
  sourceUrl: varchar("source_url", { length: 2000 }),
  sourcePath: varchar("source_path", { length: 500 }),
  browser: varchar("browser", { length: 500 }),
  viewport: varchar("viewport", { length: 64 }),
  status: varchar("status", { length: 32 }).notNull().default("NEW"),
  resolution: varchar("resolution", { length: 32 }),
  affectedLayer: varchar("affected_layer", { length: 24 }),
  rootCause: text("root_cause"),
  fixNotes: text("fix_notes"),
  frontendCommitSha: varchar("frontend_commit_sha", { length: 64 }),
  backendCommitSha: varchar("backend_commit_sha", { length: 64 }),
  regressionTestStatus: varchar("regression_test_status", { length: 24 })
    .notNull().default("NOT_REVIEWED"),
  productionVerified: boolean("production_verified").notNull().default(false),
  retestStatus: varchar("retest_status", { length: 24 })
    .notNull().default("NOT_RETESTED"),
  retestedAt: timestamp("retested_at", { withTimezone: true }),
  version: integer("version").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("db10_bug_reports_public_id_uq").on(sql.raw('lower("public_id")')),
  uniqueIndex("db10_bug_reports_legacy_id_uq").on(t.legacyReportId)
    .where(sql`${t.legacyReportId} is not null`),
  index("db10_bug_reports_environment_state_time_idx").on(t.environment,t.status,t.createdAt),
  index("db10_bug_reports_status_time_idx").on(t.status, t.createdAt),
  index("db10_bug_reports_reporter_time_idx").on(t.reporterAccessId, t.createdAt),
  index("db10_bug_reports_reporter_user_idx").on(t.reporterUserId, t.createdAt),
  index("db10_bug_reports_college_time_idx").on(t.collegeId, t.createdAt),
  index("db10_bug_reports_environment_time_idx").on(t.environment, t.createdAt),
  check("db10_bug_reports_status_ck",
    sql.raw('"status" in (\'NEW\',\'CHECKING\',\'FIXING\',\'READY_FOR_RETEST\',\'CLOSED\')')),
  check("db10_bug_reports_resolution_ck",
    sql.raw('"resolution" is null or "resolution" in (\'FIXED\',\'DUPLICATE\',\'NOT_A_BUG\',\'CANNOT_REPRODUCE\',\'WONT_FIX\')')),
  check("db10_bug_reports_regression_ck",
    sql.raw('"regression_test_status" in (\'NOT_REVIEWED\',\'NOT_REQUIRED\',\'PLANNED\',\'ADDED\')')),
  check("db10_bug_reports_retest_ck",
    sql.raw('"retest_status" in (\'NOT_RETESTED\',\'PASS\',\'FAIL\')')),
  check("db10_bug_reports_retest_timestamp_ck",
    sql.raw('("retest_status" = \'NOT_RETESTED\' and "retested_at" is null) or ("retest_status" <> \'NOT_RETESTED\' and "retested_at" is not null)')),
  check("db10_bug_reports_version_ck", sql.raw('"version" >= 0')),
  check("db10_bug_reports_severity_ck",
    sql.raw('"severity" in (\'BLOCKER\',\'CRITICAL\',\'MAJOR\',\'MINOR\',\'UI_ONLY\',\'SUGGESTION\',\'NOT_SURE\')')),
  check("db10_bug_reports_environment_ck",
    sql.raw('"environment" in (\'LOCAL\',\'DEVELOPMENT\',\'UAT\',\'PRODUCTION\',\'OTHER\',\'NOT_SURE\')')),
  check("db10_bug_reports_account_role_ck",
    sql.raw('"account_role" in (\'LEARNER\',\'FACULTY\',\'MENTOR\',\'COLLEGE_ADMIN\',\'SUPER_ADMIN\',\'NOT_SURE\')')),
  check("db10_bug_reports_layer_ck",
    sql.raw('"affected_layer" is null or "affected_layer" in (\'FRONTEND\',\'BACKEND\',\'BOTH\',\'UNKNOWN\')')),
]);

export const db10BugReportActivities = pgTable("bug_report_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  legacyActivityId: bigint("legacy_activity_id",{mode:"bigint"}),
  bugReportId: uuid("bug_report_id").notNull()
    .references(() => db10BugReports.id, { onDelete: "restrict" }),
  type: varchar("activity_type", { length: 40 }).notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "restrict" }),
  actorAccessId: uuid("actor_access_id")
    .references(() => db10BugTrackerAccess.id, { onDelete: "restrict" }),
  actorName: varchar("actor_name", { length: 120 }),
  fromValue: varchar("from_value", { length: 255 }),
  toValue: varchar("to_value", { length: 255 }),
  note: varchar("note", { length: 1000 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index("db10_bug_report_activity_report_time_idx").on(t.bugReportId, t.createdAt),
  index("db10_bug_report_activity_keyset_idx").on(t.bugReportId,t.createdAt,t.id),
  uniqueIndex("db10_bug_report_activity_legacy_id_uq").on(t.legacyActivityId)
    .where(sql`${t.legacyActivityId} is not null`),
  check("db10_bug_report_activity_type_ck",
    sql.raw('"activity_type" in (\'STATUS_CHANGED\',\'RESOLUTION_CHANGED\',\'WORKFLOW_UPDATED\',\'RETEST\',\'CREATED\')')),
  check("db10_bug_report_activity_actor_ck",
    sql`(${t.actorUserId} is not null) <> (${t.actorAccessId} is not null)
      or (${t.legacyActivityId} is not null and ${t.actorUserId} is null
        and ${t.actorAccessId} is null and length(trim(coalesce(${t.actorName},''))) > 0)`),
]);

export const db10BugReportAttachments = pgTable("bug_report_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  bugReportId: uuid("bug_report_id").notNull()
    .references(() => db10BugReports.id, { onDelete: "restrict" }),
  storageKey: varchar("storage_key", { length: 700 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("db10_bug_report_attachments_key_uq").on(t.storageKey),
  index("db10_bug_report_attachments_report_time_idx").on(t.bugReportId, t.createdAt),
  index("db10_bug_report_attachments_limit_idx").on(t.bugReportId,t.id),
  check("db10_bug_report_attachments_mime_ck",
    sql.raw('"content_type" in (\'image/png\',\'image/jpeg\',\'image/webp\')')),
  check("db10_bug_report_attachments_size_ck",
    sql.raw('"size_bytes" between 1 and 8388608')),
]);
