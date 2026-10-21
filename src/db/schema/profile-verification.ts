/** DB04 Drizzle schema: profile verification (migration 0063). */
import { sql } from "drizzle-orm";
import { bigint, boolean, check, foreignKey, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { collegeMemberships } from "./memberships";
import { colleges } from "./colleges";
import { users } from "./users";
import type { SafeSnapshot } from "@/modules/profile-verification/domain";

export const profileVerifications = pgTable("profile_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Tenant/college is always derived through owning membership, never an independent client-supplied FK.
  /** Original source IDs are for scoped import, not runtime authorization. */
  legacyStudentId: integer("legacy_student_id"),
  legacyVerificationId: integer("legacy_verification_id"),
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
  uniqueIndex("profile_verifications_id_member_uq").on(t.id, t.learnerMembershipId),
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


/** Private GCS upload receipts. No raw bytes, base64 blobs or public URLs. */
export const profilePrivateDocumentReceipts = pgTable("profile_private_document_receipts", {
  id: uuid("id").defaultRandom().primaryKey(),
  owningMembershipId: uuid("owning_membership_id").notNull()
    .references(() => collegeMemberships.id, {onDelete: "restrict"}),
  purpose: varchar("purpose", {length: 32}).notNull(),
  relatedEntryId: uuid("related_entry_id"),
  privateObjectKey: text("private_object_key").notNull(),
  objectGeneration: varchar("object_generation", {length: 80 }).notNull(),
  sha256Hex: varchar("sha256_hex", {length: 64}).notNull(),
  mimeType: varchar("mime_type", {length: 128}).notNull(),
  sizeBytes: bigint("size_bytes", {mode: "number"}).notNull(),
  scanStatus: varchar("scan_status", {length: 16}).notNull().default("PENDING"),
  uploadedByUserId: uuid("uploaded_by_user_id").notNull()
    .references(() => users.id, {onDelete: "restrict"}),
  uploadedAt: timestamp("uploaded_at", {withTimezone: true}).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", {withTimezone: true}),
  retentionUntil: timestamp("retention_until", {withTimezone: true}),
}, (t) => [
  index("profile_private_doc_member_purpose_idx").on(t.owningMembershipId, t.purpose),
  uniqueIndex("profile_private_doc_generation_uq").on(t.privateObjectKey, t.objectGeneration),
  // Required parent identities for same-owner/same-purpose child FKs in the
  // staged education and profile-image schema.
  uniqueIndex("profile_private_doc_id_owner_uq").on(t.id, t.owningMembershipId),
  uniqueIndex("profile_private_doc_id_owner_purpose_uq").on(
    t.id,
    t.owningMembershipId,
    t.purpose,
  ),
  check("profile_private_doc_purpose_ck",
    sql`${t.purpose} in ('AADHAAR','PAN','MARKSHEET','RESUME','PROFILE_IMAGE','EDUCATION_CERTIFICATE','CERTIFICATION','EXPERIENCE_CERTIFICATE','OFFER_LETTER')`),
  check("profile_private_doc_scan_ck",
    sql`${t.scanStatus} in ('PENDING','CLEAN','REJECTED')`),
  check("profile_private_doc_size_ck",
    sql`${t.sizeBytes} > 0 and ${t.sizeBytes} <= 26214400`),
  check("profile_private_doc_object_key_ck",
    sql`${t.privateObjectKey} ~ '^private/[A-Za-z0-9_/-]+$'
      and position('..' in ${t.privateObjectKey}) = 0
      and position('://' in ${t.privateObjectKey}) = 0`),
  check("profile_private_doc_generation_ck", sql`${t.objectGeneration} ~ '^[0-9]+$'`),
  check("profile_private_doc_sha256_ck", sql`${t.sha256Hex} ~ '^[0-9A-Fa-f]{64}$'`),
  check("profile_private_doc_mimetype_ck", sql`char_length(trim(${t.mimeType})) > 0`),
  check("profile_private_doc_retention_ck",
    sql`${t.retentionUntil} is null or ${t.retentionUntil} >= ${t.uploadedAt}`),
  check("profile_private_doc_revocation_ck",
    sql`${t.revokedAt} is null or ${t.revokedAt} >= ${t.uploadedAt}`),
]);

export const profileVerificationEvents = pgTable("profile_verification_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  verificationId: uuid("verification_id").notNull()
    .references(() => profileVerifications.id, {onDelete: "restrict"}),
  legacyEventId: integer("legacy_event_id"),
  legacyAction: varchar("legacy_action", {length: 64}),
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
    sql`${t.action} in ('SUBMITTED','UPDATE_SUBMITTED','VERIFIED','SENT_BACK','WITHDRAWN')`),
  check("profile_verification_events_actor_ck",
    sql`${t.actorKind} in ('LEARNER','COLLEGE_ADMIN','SUPER_ADMIN','TPO')`),
  check("profile_verification_events_revision_ck",
    sql`${t.priorVersion} >= 0 and ${t.nextVersion} = ${t.priorVersion} + 1`),
  check("profile_verification_events_sendback_reason_ck",
    sql`${t.action} != 'SENT_BACK' or (${t.note} is not null and char_length(trim(${t.note})) >= 3)`),
]);

/** College administrator-owned authorization and current CGPA conversion. */
export const profileVerificationSettings = pgTable("profile_verification_settings", {
  collegeId: uuid("college_id").primaryKey().references(() => colleges.id, {onDelete: "restrict"}),
  tpoCanVerifyProfiles: boolean("tpo_can_verify_profiles").notNull().default(true),
  cgpaToPct: varchar("cgpa_to_pct", {length: 24}).notNull().default("X9_5"),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id, {onDelete: "restrict"}),
  updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow(),
}, t => [
  check("profile_verification_settings_rule_ck", sql`${t.cgpaToPct} in
    ('X9_5','MINUS_0_5_X10','MINUS_0_75_X10','X10')`),
]);

/** Explicit delegated TPO administrator rights; a TPO membership alone is NOT enough. */
export const profileVerificationTpoGrants = pgTable("profile_verification_tpo_grants", {
  membershipId: uuid("membership_id").primaryKey()
    .references(() => collegeMemberships.id, {onDelete: "restrict"}),
  grantedByUserId: uuid("granted_by_user_id").notNull()
    .references(() => users.id, {onDelete: "restrict"}),
  grantedAt: timestamp("granted_at", {withTimezone: true}).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", {withTimezone: true}),
}, t => [
  index("profile_verification_tpo_grants_revoked_idx").on(t.revokedAt),
]);

/** Retain the original verified grade and the last derived comparable percent.
 * The current college CGPA rule may deliberately recompute the percentage.
 */
export const profileVerificationAcademicMarks = pgTable("profile_verification_academic_marks", {
  id: uuid("id").defaultRandom().primaryKey(),
  verificationId: uuid("verification_id").notNull(),
  learnerMembershipId: uuid("learner_membership_id").notNull()
    .references(() => collegeMemberships.id, {onDelete: "restrict"}),
  level: varchar("level", {length: 16}).notNull(),
  /** Unmodified source values are not live eligibility authority. */
  legacyQualificationId: integer("legacy_qualification_id"),
  legacyGradingType: varchar("legacy_grading_type", {length: 64}),
  legacyEarnedMarks: text("legacy_earned_marks"),
  legacyCgpa: text("legacy_cgpa"),
  legacyPassingYear: varchar("legacy_passing_year", {length: 20}),
  originalGrade: varchar("original_grade", {length: 64}).notNull(),
  originalScale: varchar("original_scale", {length: 32}),
  originalMax: varchar("original_max", {length: 32}),
  percentageBasisPoints: integer("percentage_basis_points"),
  appliedRule: varchar("applied_rule", {length: 24}).notNull(),
  sourceSnapshotVersion: integer("source_snapshot_version").notNull(),
  verifiedByUserId: uuid("verified_by_user_id").notNull().references(() => users.id, {onDelete: "restrict"}),
  verifiedAt: timestamp("verified_at", {withTimezone: true}).notNull(),
  updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow(),
}, t => [
  uniqueIndex("profile_verification_academic_marks_level_uq").on(t.learnerMembershipId,t.level),
  index("profile_verification_academic_marks_verification_idx").on(t.verificationId),
  foreignKey({name:"profile_verification_academic_marks_parent_fk",
    columns:[t.verificationId,t.learnerMembershipId],
    foreignColumns:[profileVerifications.id,profileVerifications.learnerMembershipId]}).onDelete("restrict"),
  check("profile_verification_academic_marks_level_ck",
    sql`${t.level} in ('10TH','12TH','DIPLOMA','UG','PG')`),
  check("profile_verification_academic_marks_percentage_ck",
    sql`${t.percentageBasisPoints} is null or ${t.percentageBasisPoints} between 0 and 10000`),
  check("profile_verification_academic_marks_revision_ck", sql`${t.sourceSnapshotVersion} > 0`),
  check("profile_verification_academic_marks_rule_ck", sql`${t.appliedRule} in
    ('X9_5','MINUS_0_5_X10','MINUS_0_75_X10','X10')`),
]);
