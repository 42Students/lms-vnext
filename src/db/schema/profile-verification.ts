/**
 * DB04 Drizzle schema: STAGED ONLY. Do not export via db/schema/index.ts or
 * generate a migration until the concurrent DB03 journal is reconciled.
 * No runtime verification is implied by this file.
 */
import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { collegeMemberships } from "./memberships";
import { users } from "./users";
import type { SafeSnapshot } from "@/modules/profile-verification/domain";

export const profileVerifications = pgTable("profile_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Tenant/college is always derived through owning membership, never an independent client-supplied FK.
  learnerMembershipId: uuid("learner_membership_id").notNull()
    .references(() => collegeMemberships.id, {onDelete: "restrict"}),
  section: varchar("section", {length: 16}).notNull(),
  status: varchar("status", {length: 20}).notNull(),
  submittedSnapshot: jsonb("submitted_snapshot").$type<SafeSnapshot>().notNull(),
  verifiedSnapshot: jsonb("verified_snapshot").$type<SafeSnapshot>(),
  submittedAt: timestamp("submitted_at", {withTimezone: true}).notNull(),
  verifiedAt: timestamp("verified_at", {withTimezone: true}),
  decidedAt: timestamp("decided_at", {withTimezone: true}),
  decidedByUserId: uuid("decided_by_user_id").references(() => users.id, {onDelete: "restrict"}),
  decidedByName: varchar("decided_by_name", {length: 200}),
  note: varchar("note", {length: 500}),
  rowVersion: integer("row_version").notNull().default(1),
  createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("profile_verifications_learner_section_uq").on(t.learnerMembershipId, t.section),
  index("profile_verifications_status_section_idx").on(t.status, t.section),
  index("profile_verifications_learner_status_idx").on(t.learnerMembershipId, t.status),
  check("profile_verifications_section_ck", sql`${t.section} in ('EDUCATION','IDENTITY')`),
  check("profile_verifications_status_ck",
    sql`${t.status} in ('SUBMITTED','SENT_BACK','VERIFIED','UPDATE_PENDING')`),
  check("profile_verifications_row_version_ck", sql`${t.rowVersion} >= 1`),
  check("profile_verifications_verified_state_ck",
    sql`${t.status} not in ('VERIFIED','UPDATE_PENDING') or
      (${t.verifiedSnapshot} is not null and ${t.verifiedAt} is not null)`),
  check("profile_verifications_send_back_note_ck",
    sql`${t.status} != 'SENT_BACK' or (${t.note} is not null and char_length(trim(${t.note})) >= 3)`),
]);

export const profileVerificationEvents = pgTable("profile_verification_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  verificationId: uuid("verification_id").notNull()
    .references(() => profileVerifications.id, {onDelete: "restrict"}),
  action: varchar("action", {length: 20}).notNull(),
  actorKind: varchar("actor_kind", {length: 20}).notNull(),
  actorUserId: uuid("actor_user_id").notNull()
    .references(() => users.id, {onDelete: "restrict"}),
  actorName: varchar("actor_name", {length: 200}),
  note: varchar("note", {length: 500}),
  snapshot: jsonb("snapshot").$type<SafeSnapshot>(),
  priorVersion: integer("prior_version").notNull(),
  nextVersion: integer("next_version").notNull(),
  createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("profile_verification_events_revision_uq").on(t.verificationId, t.nextVersion),
  index("profile_verification_events_created_idx").on(t.verificationId, t.createdAt),
  check("profile_verification_events_action_ck",
    sql`${t.action} in ('SUBMITTED','UPDATE_SUBMITTED','VERIFIED','SENT_BACK')`),
  check("profile_verification_events_actor_ck",
    sql`${t.actorKind} in ('LEARNER','COLLEGE_ADMIN','SUPER_ADMIN','TPO')`),
  check("profile_verification_events_revision_ck",
    sql`${t.priorVersion} >= 0 and ${t.nextVersion} = ${t.priorVersion} + 1`),
  check("profile_verification_events_sendback_reason_ck",
    sql`${t.action} != 'SENT_BACK' or (${t.note} is not null and char_length(trim(${t.note})) >= 3)`),
]);
