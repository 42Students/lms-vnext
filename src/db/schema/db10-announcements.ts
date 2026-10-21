/**
 * DB10 announcements schema DRAFT ONLY.
 * W01 owns migration registration/journal. This file is intentionally not
 * exported from src/db/schema/index.ts until migration replay is approved.
 *
 * Legacy source: announcements + V127 schedule/expiry/pin.
 * Normalization: receiver_value becomes UUID receiver_id and explicit
 * organization_id/college_id are persisted for tenant-safe reads.
 */
import { sql } from "drizzle-orm";
import {
  bigint, boolean, check, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { organizations } from "./organizations";
import { users } from "./users";

/** Source broadcast identity is separate from each college-scoped announcement. */
export const announcementBroadcastGroups = pgTable("announcement_broadcast_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "restrict" }),
  authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "restrict" }),
  legacyPlacementAnnouncementId: bigint("legacy_placement_announcement_id", { mode: "bigint" }),
  legacyCollegeId: integer("legacy_college_id"),
  audience: varchar("audience", { length: 20 }),
  audienceKind: varchar("audience_kind", { length: 20 }),
  audienceJson: jsonb("audience_json").$type<unknown>(),
  audienceLabel: varchar("audience_label", { length: 255 }),
  recipientCount: integer("recipient_count"),
  legacyJobId: integer("legacy_job_id"),
  sendAt: timestamp("send_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  showUntil: timestamp("show_until", { withTimezone: true }),
  sendEmail: boolean("send_email").notNull().default(false),
  undoGroup: varchar("undo_group", { length: 64 }),
  lastRemindedAt: timestamp("last_reminded_at", { withTimezone: true }),
  legacyWasDeleted: boolean("legacy_was_deleted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("announcement_broadcast_groups_legacy_uq")
    .on(t.organizationId, t.legacyPlacementAnnouncementId)
    .where(sql`${t.legacyPlacementAnnouncementId} is not null`),
  index("announcement_broadcast_groups_scope_idx").on(t.organizationId, t.createdAt),
  check("announcement_broadcast_groups_recipients_ck",
    sql`${t.recipientCount} is null or ${t.recipientCount} >= 0`),
]);

export const db10Announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    broadcastGroupId: uuid("broadcast_group_id")
      .references(() => announcementBroadcastGroups.id, { onDelete: "restrict" }),
    legacyAnnouncementId: bigint("legacy_announcement_id", { mode: "bigint" }),
    legacyReceiverValue: bigint("legacy_receiver_value", { mode: "bigint" }),
    legacySenderId: bigint("legacy_sender_id", { mode: "bigint" }),
    legacySenderType: varchar("legacy_sender_type",{length:40}),
    legacyReceiverType: varchar("legacy_receiver_type",{length:40}),
    legacyReceiverLabel: varchar("legacy_receiver_label",{length:160}),
    legacyOriginalTitle: text("legacy_original_title"),
    legacyOriginalMessage: text("legacy_original_message"),
    legacySourceCreatedLocal: timestamp("legacy_source_created_local",{withTimezone:false}),
    legacySourceUpdatedLocal: timestamp("legacy_source_updated_local",{withTimezone:false}),
    legacySourceTimeZone: varchar("legacy_source_time_zone",{length:80}),
    legacyWasTitleMissing: boolean("legacy_was_title_missing"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    organizationId: uuid("organization_id").notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    receiverType: varchar("receiver_type", { length: 24 }).notNull(),
    receiverId: uuid("receiver_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    senderUserId: uuid("sender_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    senderType: varchar("sender_type", { length: 32 }).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isPinned: boolean("is_pinned").notNull().default(false),
    buttonLabel: varchar("button_label", { length: 60 }),
    buttonUrl: varchar("button_url", { length: 500 }),
    /** Raw legacy links are never delivered directly; validate before mapping. */
    legacyButtonUrl: text("legacy_button_url"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedByUserId: uuid("deleted_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("db10_announcements_broadcast_college_uq")
      .on(t.broadcastGroupId, t.collegeId)
      .where(sql`${t.broadcastGroupId} is not null`),
    index("db10_announcements_scope_deleted_time_idx")
      .on(t.collegeId, t.deletedAt, t.createdAt),
    index("db10_announcements_org_deleted_time_idx")
      .on(t.organizationId, t.deletedAt, t.createdAt),
    index("db10_announcements_recipient_visibility_idx")
      .on(t.receiverType, t.receiverId, t.deletedAt, t.scheduledAt, t.expiresAt, t.isPinned),
    check(
      "db10_announcements_receiver_type_ck",
      sql`${t.receiverType} in ('COLLEGE','PROGRAM','DEPARTMENT','LEARNER','FACULTY','CLASS')`,
    ),
    check(
      "db10_announcements_sender_type_ck",
      sql`${t.senderType} in ('SUPER_ADMIN','COLLEGE_ADMIN','FACULTY','LEARNER','TPO','SYSTEM')`,
    ),
    check("db10_announcements_version_ck", sql`${t.version} >= 0`),
    check(
      "db10_announcements_schedule_order_ck",
      sql`${t.expiresAt} is null or ${t.scheduledAt} is null or ${t.expiresAt} > ${t.scheduledAt}`,
    ),
    check(
      "announcements_cta_pair_ck",
      sql`(${t.buttonLabel} is null and ${t.buttonUrl} is null)
        or (${t.buttonLabel} is not null and length(trim(${t.buttonLabel})) between 1 and 60
          and ${t.buttonUrl} is not null and ${t.buttonUrl} ~ '^https://[^[:space:]]+$')`,
    ),
    check(
      "db10_announcements_delete_shape_ck",
      sql`(${t.deletedAt} is null and ${t.deletedByUserId} is null)
        or (${t.deletedAt} is not null and ${t.deletedByUserId} is not null)`,
    ),
  ],
);

export const placementCellAnnouncementReads = pgTable(
  "placement_cell_announcement_reads",
  {
    announcementId: uuid("announcement_id").notNull()
      .references(() => db10Announcements.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    firstReadByUserId: uuid("first_read_by_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    firstReadAt: timestamp("first_read_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.announcementId, t.collegeId] }),
    index("placement_cell_announcement_reads_by_college_idx")
      .on(t.collegeId, sql`${t.firstReadAt} desc`),
  ],
);

/** Historical target college set; not authorization to send to current memberships. */
export const announcementBroadcastColleges = pgTable("announcement_broadcast_colleges", {
  broadcastGroupId: uuid("broadcast_group_id").notNull()
    .references(() => announcementBroadcastGroups.id, { onDelete: "restrict" }),
  collegeId: uuid("college_id").notNull()
    .references(() => colleges.id, { onDelete: "restrict" }),
}, (t) => [primaryKey({ columns: [t.broadcastGroupId, t.collegeId] })]);

export const announcementBroadcastLearners = pgTable("announcement_broadcast_learners", {
  id: uuid("id").defaultRandom().primaryKey(),
  broadcastGroupId: uuid("broadcast_group_id").notNull()
    .references(() => announcementBroadcastGroups.id, { onDelete: "restrict" }),
  collegeId: uuid("college_id").notNull()
    .references(() => colleges.id, { onDelete: "restrict" }),
  recipientUserId: uuid("recipient_user_id").references(() => users.id, { onDelete: "restrict" }),
  legacyLearnerId: integer("legacy_learner_id"),
}, (t) => [
  uniqueIndex("announcement_broadcast_learners_recipient_uq")
    .on(t.broadcastGroupId, t.recipientUserId)
    .where(sql`${t.recipientUserId} is not null`),
  index("announcement_broadcast_learners_college_idx").on(t.collegeId, t.broadcastGroupId),
  check("announcement_broadcast_learners_identity_ck",
    sql`${t.recipientUserId} is not null or ${t.legacyLearnerId} is not null`),
]);

/** Historic per-faculty/learner reads, never a substitute for the college first-read rollup. */
export const announcementBroadcastReaderHistory = pgTable("announcement_broadcast_reader_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  broadcastGroupId: uuid("broadcast_group_id").notNull()
    .references(() => announcementBroadcastGroups.id, { onDelete: "restrict" }),
  collegeId: uuid("college_id").notNull()
    .references(() => colleges.id, { onDelete: "restrict" }),
  legacyReaderType: varchar("legacy_reader_type", { length: 20 }),
  legacyReaderId: integer("legacy_reader_id"),
  readerUserId: uuid("reader_user_id").references(() => users.id, { onDelete: "restrict" }),
  readAt: timestamp("read_at", { withTimezone: true }).notNull(),
}, (t) => [
  index("announcement_broadcast_reader_history_scope_idx")
    .on(t.broadcastGroupId, t.collegeId, t.readAt),
  uniqueIndex("announcement_broadcast_reader_history_source_uq")
    .on(t.broadcastGroupId, t.legacyReaderType, t.legacyReaderId)
    .where(sql`${t.legacyReaderId} is not null`),
  check("announcement_broadcast_reader_history_identity_ck",
    sql`${t.readerUserId} is not null or ${t.legacyReaderId} is not null`),
]);
