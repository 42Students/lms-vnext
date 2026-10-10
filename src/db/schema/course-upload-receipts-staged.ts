/** W02 DB05/DB06 staged only; W01 owns migration registration/index export. */
import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { courseAssignments, assignmentSubmissions, lessonContents } from "./assessments";
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
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    consumedBySubmissionId: uuid("consumed_by_submission_id").references(() => assignmentSubmissions.id, { onDelete: "restrict" }),
    revoked: boolean("revoked").notNull().default(false),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("course_upload_receipts_object_key_uq").on(table.objectKey),
    uniqueIndex("course_upload_receipts_submission_uq").on(table.consumedBySubmissionId).where(sql`${table.consumedBySubmissionId} is not null`),
    index("course_upload_receipts_owner_expiry_idx").on(table.ownerMembershipId, table.expiresAt),
    check("course_upload_receipts_purpose_ck", sql`${table.purpose} in (\'ASSIGNMENT_SUBMISSION\', \'COURSE_RESOURCE\')`),
    check("course_upload_receipts_target_ck", sql`(${table.purpose} = \'ASSIGNMENT_SUBMISSION\' and ${table.assignmentId} is not null and ${table.lessonContentId} is null) or (${table.purpose} = \'COURSE_RESOURCE\' and ${table.lessonContentId} is not null and ${table.assignmentId} is null)`),
    check("course_upload_receipts_declared_size_ck", sql`${table.declaredSizeBytes} > 0 and ${table.declaredSizeBytes} <= 52428800`),
    check("course_upload_receipts_attestation_ck", sql`(${table.consumedAt} is null and ${table.consumedBySubmissionId} is null) or (${table.consumedAt} is not null and ${table.attestedGeneration} is not null and ${table.actualContentType} is not null and ${table.actualSizeBytes} is not null and ${table.sha256Hex} is not null)`),
  ],
);

export const assignmentSubmissionFiles = pgTable(
  "assignment_submission_files",
  {
    assignmentSubmissionId: uuid("assignment_submission_id").primaryKey().references(() => assignmentSubmissions.id, { onDelete: "cascade" }),
    uploadReceiptId: uuid("upload_receipt_id").notNull().references(() => courseUploadReceipts.id, { onDelete: "restrict" }),
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
    check("assignment_submission_files_size_ck", sql`${table.sizeBytes} > 0 and ${table.sizeBytes} <= 52428800`),
    check("assignment_submission_files_sha_ck", sql`${table.sha256Hex} ~ \'^[0-9a-f]{64}$\'`),
  ],
);
