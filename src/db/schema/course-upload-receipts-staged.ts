/**
 * DB-053 / DB06 SOURCE-ONLY staged private upload receipts/files.
 * Do not export from the schema barrel or treat as migrated until the migration
 * integrator reconciles DB-016 overlap, producer/read cutover and PostgreSQL
 * acceptance.
 * Legacy owner_user_id and owner_user_type cannot be cast directly to a UUID:
 * resolve verified collegeMembership and ACTIVE role in the same college,
 * with an actor/ownership crosswalk before accepting a receipt. Never infer a
 * membership from name or numeric ID alone. This separate staging contract
 * must not duplicate the live assignment_submission_files relations.
 * Multi-file submissions are already modeled by per-submission sequence and
 * uniqueness here; the producer/UI must authorize each CLEAN scanned receipt,
 * atomically consume distinct receipts and preserve per-file order, rather
 * than hard-code sequence 0. No scan bypass or unsigned download allowed.
 */
import { sql } from "drizzle-orm";
import { boolean, check, foreignKey, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { courseAssignments, assignmentSubmissions } from "./assessments";
import { courseSectionDeliveries, lessonContents } from "./courses";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { users } from "./users";

export const courseUploadReceipts = pgTable(
  "course_upload_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "restrict" }),
    ownerMembershipId: uuid("owner_membership_id").notNull().references(() => collegeMemberships.id, { onDelete: "restrict" }),
    purpose: text("purpose").notNull(),
    assignmentId: uuid("assignment_id").references(() => courseAssignments.id, { onDelete: "restrict" }),
    deliveryId: uuid("delivery_id").references(() => courseSectionDeliveries.id, { onDelete: "restrict" }),
    lessonContentId: uuid("lesson_content_id").references(() => lessonContents.id, { onDelete: "restrict" }),
    objectKey: text("object_key").notNull(),
    uploadTokenHash: text("upload_token_hash").notNull(),
    originalName: text("original_name").notNull(),
    declaredContentType: text("declared_content_type").notNull(),
    declaredSizeBytes: integer("declared_size_bytes").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attestedGeneration: text("attested_generation"),
    actualContentType: text("actual_content_type"),
    actualSizeBytes: integer("actual_size_bytes"),
    sha256Hex: text("sha256_hex"),
    scanStatus: varchar("scan_status", { length: 16 }).notNull().default("PENDING"),
    scanAttestedBy: varchar("scan_attested_by", { length: 160 }),
    scanAttestedAt: timestamp("scan_attested_at", { withTimezone: true }),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    consumedBySubmissionId: uuid("consumed_by_submission_id").references(() => assignmentSubmissions.id, { onDelete: "restrict" }),
    revoked: boolean("revoked").notNull().default(false),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedByUserId: uuid("revoked_by_user_id").references(() => users.id, { onDelete: "restrict" }),
    revocationReason: varchar("revocation_reason", { length: 1000 }),
    retentionUntil: timestamp("retention_until", { withTimezone: true }),
    deletionRequestedAt: timestamp("deletion_requested_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("course_upload_receipts_object_key_uq").on(table.objectKey),
    index("course_upload_receipts_submission_idx").on(table.consumedBySubmissionId),
    uniqueIndex("course_upload_receipts_consumed_attestation_uq").on(
      table.id,
      table.consumedBySubmissionId,
      table.objectKey,
      table.attestedGeneration,
      table.actualContentType,
      table.actualSizeBytes,
      table.sha256Hex,
      table.originalName,
    ),
    index("course_upload_receipts_owner_expiry_idx").on(table.ownerMembershipId, table.expiresAt),
    index("course_upload_receipts_retention_idx").on(table.retentionUntil),
    check("course_upload_receipts_purpose_ck", sql`${table.purpose} in (\'ASSIGNMENT_SUBMISSION\', \'COURSE_RESOURCE\')`),
    check("course_upload_receipts_target_ck", sql`(${table.purpose} = \'ASSIGNMENT_SUBMISSION\' and ${table.assignmentId} is not null and ${table.deliveryId} is not null and ${table.lessonContentId} is null) or (${table.purpose} = \'COURSE_RESOURCE\' and ${table.lessonContentId} is not null and ${table.assignmentId} is null)`),
    check("course_upload_receipts_object_scope_ck", sql`(${table.purpose} = \'ASSIGNMENT_SUBMISSION\' and ${table.objectKey} like (\'private/\' || ${table.collegeId}::text || \'/\' || ${table.ownerMembershipId}::text || \'/assignment-submission/%\')) or (${table.purpose} = \'COURSE_RESOURCE\' and ${table.objectKey} like (\'private/\' || ${table.collegeId}::text || \'/\' || ${table.ownerMembershipId}::text || \'/course-resource/%\'))`),
    check("course_upload_receipts_token_hash_ck", sql`${table.uploadTokenHash} ~ \'^[0-9a-f]{64}$\'`),
    check("course_upload_receipts_original_name_ck", sql`length(trim(${table.originalName})) between 1 and 255 and ${table.originalName} not like \'%/%\' and position(\'\\\' in ${table.originalName}) = 0 and trim(${table.originalName}) not in (\'.\',\'..\')`),
    check("course_upload_receipts_declared_content_type_ck", sql`length(trim(${table.declaredContentType})) between 1 and 128`),
    check("course_upload_receipts_declared_size_ck", sql`${table.declaredSizeBytes} > 0 and ${table.declaredSizeBytes} <= 52428800`),
    check("course_upload_receipts_expiry_ck", sql`${table.expiresAt} > ${table.createdAt} and ${table.expiresAt} <= ${table.createdAt} + interval \'15 minutes\'`),
    check("course_upload_receipts_scan_status_ck", sql`${table.scanStatus} in (\'PENDING\',\'CLEAN\',\'REJECTED\')`),
    check("course_upload_receipts_scan_attestation_ck", sql`(${table.scanStatus} = \'PENDING\' and ${table.scanAttestedBy} is null and ${table.scanAttestedAt} is null) or (${table.scanStatus} in (\'CLEAN\',\'REJECTED\') and ${table.scanAttestedBy} = \'lms-vnext-privileged-scanner\' and ${table.scanAttestedAt} is not null)`),
    check("course_upload_receipts_attestation_ck", sql`(${table.attestedGeneration} is null and ${table.actualContentType} is null and ${table.actualSizeBytes} is null and ${table.sha256Hex} is null) or (${table.attestedGeneration} ~ \'^[0-9]+$\' and ${table.actualContentType} is not null and length(trim(${table.actualContentType})) > 0 and ${table.actualSizeBytes} is not null and ${table.actualSizeBytes} > 0 and ${table.sha256Hex} ~ \'^[0-9a-f]{64}$\')`),
    check("course_upload_receipts_consumed_ck", sql`(${table.consumedAt} is null and ${table.consumedBySubmissionId} is null) or (${table.consumedAt} is not null and ${table.consumedBySubmissionId} is not null and ${table.scanStatus} = \'CLEAN\' and ${table.scanAttestedBy} = \'lms-vnext-privileged-scanner\' and ${table.scanAttestedAt} is not null and ${table.attestedGeneration} is not null and ${table.actualContentType} is not null and ${table.actualSizeBytes} is not null and ${table.sha256Hex} is not null and ${table.consumedAt} >= ${table.scanAttestedAt} and ${table.consumedAt} <= ${table.expiresAt} and ${table.retentionUntil} is not null and ${table.retentionUntil} >= ${table.consumedAt})`),
    check("course_upload_receipts_revocation_ck", sql`(${table.revoked} = false and ${table.revokedAt} is null and ${table.revokedByUserId} is null and ${table.revocationReason} is null) or (${table.revoked} = true and ${table.revokedAt} is not null and ${table.revokedByUserId} is not null and ${table.revocationReason} is not null and length(trim(${table.revocationReason})) >= 3 and ${table.revokedAt} >= ${table.createdAt})`),
    check("course_upload_receipts_retention_ck", sql`${table.retentionUntil} is null or ${table.retentionUntil} >= ${table.createdAt}`),
    check("course_upload_receipts_deletion_ck", sql`(${table.deletionRequestedAt} is null and ${table.deletedAt} is null) or (${table.deletionRequestedAt} is not null and ${table.retentionUntil} is not null and ${table.deletionRequestedAt} >= ${table.retentionUntil} and (${table.deletedAt} is null or (${table.deletedAt} >= ${table.deletionRequestedAt} and ${table.deletedAt} >= ${table.retentionUntil})))`),
  ],
);

export const assignmentSubmissionFiles = pgTable(
  "assignment_submission_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assignmentSubmissionId: uuid("assignment_submission_id").notNull().references(() => assignmentSubmissions.id, { onDelete: "restrict" }),
    uploadReceiptId: uuid("upload_receipt_id").notNull().references(() => courseUploadReceipts.id, { onDelete: "restrict" }),
    sequence: integer("sequence").notNull(),
    title: text("title"),
    objectKey: text("object_key").notNull(),
    objectGeneration: text("object_generation").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256Hex: text("sha256_hex").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("assignment_submission_files_receipt_uq").on(table.uploadReceiptId),
    uniqueIndex("assignment_submission_files_object_key_uq").on(table.objectKey),
    uniqueIndex("assignment_submission_files_submission_sequence_uq").on(table.assignmentSubmissionId, table.sequence),
    index("assignment_submission_files_submission_idx").on(table.assignmentSubmissionId),
    foreignKey({
      name: "assignment_submission_files_consumed_attestation_fk",
      columns: [
        table.uploadReceiptId,
        table.assignmentSubmissionId,
        table.objectKey,
        table.objectGeneration,
        table.mimeType,
        table.sizeBytes,
        table.sha256Hex,
        table.originalName,
      ],
      foreignColumns: [
        courseUploadReceipts.id,
        courseUploadReceipts.consumedBySubmissionId,
        courseUploadReceipts.objectKey,
        courseUploadReceipts.attestedGeneration,
        courseUploadReceipts.actualContentType,
        courseUploadReceipts.actualSizeBytes,
        courseUploadReceipts.sha256Hex,
        courseUploadReceipts.originalName,
      ],
    }).onDelete("restrict"),
    check("assignment_submission_files_sequence_ck", sql`${table.sequence} >= 0`),
    check("assignment_submission_files_size_ck", sql`${table.sizeBytes} > 0 and ${table.sizeBytes} <= 52428800`),
    check("assignment_submission_files_sha_ck", sql`${table.sha256Hex} ~ \'^[0-9a-f]{64}$\'`),
  ],
);
