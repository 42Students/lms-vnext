import { sql } from "drizzle-orm";
import { bigint, boolean, check, index, integer, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { users } from "./users";
export const lmsGroups = pgTable("lms_groups", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  legacyGroupId: bigint("legacy_group_id", { mode: "bigint" }),
  legacyCollegeId: integer("legacy_college_id"),
  legacyOrganizationId: integer("legacy_organization_id"),
  legacyWasDeleted: boolean("legacy_was_deleted"),
  kind: varchar("kind", { length: 40 }).notNull(),
  ownerScope: varchar("owner_scope", { length: 20 }).default('COLLEGE').notNull(),
  collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 150 }).notNull(),
  description: varchar("description", { length: 1000 }),
  status: varchar("status", { length: 20 }).default('DRAFT').notNull(),
  capacity: integer("capacity"),
  activeCount: integer("active_count").default(0).notNull(),
  selfJoinOpenFrom: timestamp("self_join_open_from", { withTimezone: true }),
  selfJoinOpenUntil: timestamp("self_join_open_until", { withTimezone: true }),
  academicYear: varchar("academic_year", { length: 20 }),
  semesterNumber: integer("semester_number"),
  configJson: jsonb("config_json").$type<Record<string, unknown>>().default(sql.raw("'{}'::jsonb")).notNull(),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  // Legacy created_by_type is nullable; snapshot it to preserve historical role.
  createdByType: varchar("created_by_type", { length: 20 }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [
  index("lms_groups_college_kind_idx").on(t.collegeId, t.kind, t.status),
  index("lms_groups_kind_status_idx").on(t.kind, t.status),
  check("lms_groups_scope_ck", sql.raw("(\"owner_scope\" = 'PLATFORM' AND \"college_id\" IS NULL) OR (\"owner_scope\" = 'COLLEGE' AND \"college_id\" IS NOT NULL)")),
  check("lms_groups_status_ck", sql.raw("\"status\" IN ('DRAFT','ACTIVE','CLOSED','ARCHIVED')")),
  check("lms_groups_kind_ck", sql.raw("length(trim(\"kind\")) > 0")),
  check("lms_groups_name_ck", sql.raw("length(trim(\"name\")) > 0")),
  check("lms_groups_capacity_ck", sql.raw("\"capacity\" IS NULL OR \"capacity\" > 0")),
  check("lms_groups_count_ck", sql.raw("\"active_count\" >= 0 AND (\"capacity\" IS NULL OR \"active_count\" <= \"capacity\")")),
  check("lms_groups_join_window_ck", sql.raw("\"self_join_open_until\" IS NULL OR (\"self_join_open_from\" IS NOT NULL AND \"self_join_open_until\" >= \"self_join_open_from\")")),
  check("lms_groups_creator_type_ck", sql.raw("\"created_by_type\" IS NULL OR \"created_by_type\" IN ('LEARNER','FACULTY','COLLEGE_ADMIN','SUPER_ADMIN','SYSTEM')")),
  check("lms_groups_version_ck", sql.raw("\"version\" >= 0")),
]);

export const lmsGroupMembers = pgTable("lms_group_members", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  legacyMemberId: bigint("legacy_member_id", { mode: "bigint" }),
  legacyLearnerId: integer("legacy_learner_id"),
  legacyRollNumber: varchar("legacy_roll_number", { length: 128 }),
  groupId: uuid("group_id").notNull().references(() => lmsGroups.id, { onDelete: "restrict" }),
  membershipId: uuid("membership_id").notNull().references(() => collegeMemberships.id, { onDelete: "restrict" }),
  memberType: varchar("member_type", { length: 20 }).default('LEARNER').notNull(),
  state: varchar("state", { length: 20 }).notNull(),
  source: varchar("source", { length: 20 }).notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  waitlistPosition: integer("waitlist_position"),
  note: varchar("note", { length: 500 }),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  version: integer("version").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [
  uniqueIndex("lms_group_members_group_membership_uq").on(t.groupId, t.membershipId),
  index("lms_group_members_membership_state_idx").on(t.membershipId, t.state),
  index("lms_group_members_group_state_waitlist_idx").on(t.groupId, t.state, t.waitlistPosition),
  check("lms_group_members_type_ck", sql.raw("\"member_type\" IN ('LEARNER','FACULTY')")),
  check("lms_group_members_state_ck", sql.raw("\"state\" IN ('REQUESTED','ACTIVE','WAITLISTED','REMOVED')")),
  check("lms_group_members_source_ck", sql.raw("\"source\" IN ('MANUAL','CSV','RULE','SELF')")),
  check("lms_group_members_position_ck", sql.raw("\"waitlist_position\" IS NULL OR \"waitlist_position\" > 0")),
  check("lms_group_members_waitlist_shape_ck", sql.raw("\"state\" = 'WAITLISTED' OR \"waitlist_position\" IS NULL")),
  check("lms_group_members_version_ck", sql.raw("\"version\" >= 0")),
]);

export const lmsGroupMemberEvents = pgTable("lms_group_member_events", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  legacyEventId: bigint("legacy_event_id", { mode: "bigint" }),
  legacyActorId: integer("legacy_actor_id"),
  groupId: uuid("group_id").notNull().references(() => lmsGroups.id, { onDelete: "restrict" }),
  membershipId: uuid("membership_id").notNull().references(() => collegeMemberships.id, { onDelete: "restrict" }),
  fromState: varchar("from_state", { length: 20 }),
  toState: varchar("to_state", { length: 20 }).notNull(),
  // Persist event member type: do not derive historical type from mutable roles.
  memberType: varchar("member_type", { length: 20 }).notNull().default("LEARNER"),
  source: varchar("source", { length: 20 }).notNull(),
  actorType: varchar("actor_type", { length: 20 }).notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "restrict" }),
  reason: varchar("reason", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [
  index("lms_group_events_group_time_idx").on(t.groupId, t.createdAt),
  index("lms_group_events_member_time_idx").on(t.membershipId, t.createdAt),
  check("lms_group_events_state_ck", sql.raw("\"to_state\" IN ('REQUESTED','ACTIVE','WAITLISTED','REMOVED') AND (\"from_state\" IS NULL OR \"from_state\" IN ('REQUESTED','ACTIVE','WAITLISTED','REMOVED'))")),
  check("lms_group_events_member_type_ck", sql.raw("\"member_type\" IN ('LEARNER','FACULTY')")),
  check("lms_group_events_source_ck", sql.raw("\"source\" IN ('MANUAL','CSV','RULE','SELF')")),
  check("lms_group_events_actor_ck", sql.raw("\"actor_type\" IN ('LEARNER','FACULTY','COLLEGE_ADMIN','SUPER_ADMIN','SYSTEM')")),
]);

export const lmsGroupRules = pgTable("lms_group_rules", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  groupId: uuid("group_id").notNull().references(() => lmsGroups.id, { onDelete: "restrict" }),
  criteriaJson: jsonb("criteria_json").$type<Record<string, unknown>>().notNull(),
  criteriaVersion: integer("criteria_version").default(1).notNull(),
  autoRefresh: boolean("auto_refresh").default(false).notNull(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunMatched: integer("last_run_matched"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [
  uniqueIndex("lms_group_rules_group_uq").on(t.groupId),
  check("lms_group_rules_criteria_version_ck", sql.raw("\"criteria_version\" >= 1")),
  check("lms_group_rules_matched_ck", sql.raw("\"last_run_matched\" IS NULL OR \"last_run_matched\" >= 0")),
]);
