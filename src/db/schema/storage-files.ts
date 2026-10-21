/**
 * Private file and video persistence (R2): assignment submission files,
 * project resource files, lesson video assets, plus an append-only access
 * event log. Every row carries its college and is tied to the owning
 * membership through a composite (membership, college) foreign key.
 *
 * Object keys are opaque logical keys (`private/<college>/<membership>/<namespace>/<uuid>`)
 * and never URLs. Read URLs are minted per request and are never stored.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { assignmentSubmissions, courseAssignments } from "./assessments";
import { colleges } from "./colleges";
import {
  courseLessons,
  courseSectionDeliveries,
  lessonContents,
} from "./courses";
import { collegeMemberships } from "./memberships";
import { projectInstances, projectResources } from "./projects";
import { users } from "./users";

const FILE_STATUSES = "'UPLOADING','VERIFYING','READY','QUARANTINED','FAILED','DELETED'";
const SCAN_STATUSES = "'PENDING','CLEAN','REJECTED'";
const MAX_FILE_BYTES = 52428800; // 50 MiB, legacy limit for assignment and project files
const MAX_VIDEO_BYTES = 5138022400; // 4900 MiB, below the R2 single-PUT ceiling
const MAX_THUMBNAIL_BYTES = 5242880; // 5 MiB

export const assignmentSubmissionFiles = pgTable(
  "assignment_submission_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => courseAssignments.id),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => courseSectionDeliveries.id),
    ownerMembershipId: uuid("owner_membership_id").notNull(),
    /** Set when the learner submits; null while the file is only staged. */
    submissionId: uuid("submission_id"),
    /** Position inside the submission, assigned at submit time. */
    sequence: integer("sequence"),
    objectKey: text("object_key").notNull(),
    uploadTokenHash: varchar("upload_token_hash", { length: 64 }).notNull(),
    uploadExpiresAt: timestamp("upload_expires_at", { withTimezone: true }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    declaredContentType: varchar("declared_content_type", { length: 128 }).notNull(),
    declaredSizeBytes: bigint("declared_size_bytes", { mode: "number" }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("UPLOADING"),
    objectGeneration: text("object_generation"),
    verifiedContentType: varchar("verified_content_type", { length: 128 }),
    verifiedSizeBytes: bigint("verified_size_bytes", { mode: "number" }),
    sha256Hex: varchar("sha256_hex", { length: 64 }),
    scanStatus: varchar("scan_status", { length: 16 }).notNull().default("PENDING"),
    scanAttestedBy: varchar("scan_attested_by", { length: 80 }),
    scanAttestedAt: timestamp("scan_attested_at", { withTimezone: true }),
    failureCode: varchar("failure_code", { length: 64 }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedByUserId: uuid("deleted_by_user_id").references(() => users.id),
  },
  (t) => [
    uniqueIndex("assignment_submission_files_object_key_uq").on(t.objectKey),
    uniqueIndex("assignment_submission_files_submission_sequence_uq")
      .on(t.submissionId, t.sequence)
      .where(sql`${t.submissionId} is not null and ${t.status} <> 'DELETED'`),
    index("assignment_submission_files_owner_assignment_idx").on(
      t.ownerMembershipId,
      t.assignmentId,
      t.deliveryId,
    ),
    index("assignment_submission_files_submission_idx").on(t.submissionId),
    index("assignment_submission_files_college_status_idx").on(t.collegeId, t.status),
    foreignKey({
      name: "assignment_submission_files_owner_college_fk",
      columns: [t.ownerMembershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }),
    foreignKey({
      name: "assignment_submission_files_submission_scope_fk",
      columns: [t.submissionId, t.assignmentId, t.ownerMembershipId],
      foreignColumns: [
        assignmentSubmissions.id,
        assignmentSubmissions.assignmentId,
        assignmentSubmissions.membershipId,
      ],
    }),
    check("assignment_submission_files_status_ck", sql`${t.status} in (${sql.raw(FILE_STATUSES)})`),
    check("assignment_submission_files_scan_status_ck", sql`${t.scanStatus} in (${sql.raw(SCAN_STATUSES)})`),
    check(
      "assignment_submission_files_declared_size_ck",
      sql`${t.declaredSizeBytes} between 1 and ${sql.raw(String(MAX_FILE_BYTES))}`,
    ),
    check(
      "assignment_submission_files_verified_size_ck",
      sql`${t.verifiedSizeBytes} is null or ${t.verifiedSizeBytes} between 1 and ${sql.raw(String(MAX_FILE_BYTES))}`,
    ),
    check(
      "assignment_submission_files_content_type_ck",
      sql`length(trim(${t.declaredContentType})) between 3 and 128 and position('/' in ${t.declaredContentType}) > 1`,
    ),
    check(
      "assignment_submission_files_name_ck",
      sql`length(trim(${t.originalName})) between 1 and 255 and ${t.originalName} !~ '[/\\\\]' and trim(${t.originalName}) not in ('.', '..')`,
    ),
    check(
      "assignment_submission_files_token_hash_ck",
      sql`${t.uploadTokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "assignment_submission_files_sha_ck",
      sql`${t.sha256Hex} is null or ${t.sha256Hex} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "assignment_submission_files_object_key_ck",
      sql`${t.objectKey} like ('private/' || ${t.collegeId}::text || '/' || ${t.ownerMembershipId}::text || '/assignment-submission/%')`,
    ),
    check(
      "assignment_submission_files_sequence_ck",
      sql`${t.sequence} is null or ${t.sequence} >= 0`,
    ),
    check(
      "assignment_submission_files_sequence_submission_ck",
      sql`${t.sequence} is null or ${t.submissionId} is not null`,
    ),
    check(
      "assignment_submission_files_ready_ck",
      sql`${t.status} <> 'READY' or (${t.scanStatus} = 'CLEAN' and ${t.scanAttestedBy} is not null and ${t.scanAttestedAt} is not null and ${t.objectGeneration} ~ '^[0-9]+$' and ${t.verifiedSizeBytes} is not null and ${t.verifiedContentType} is not null and ${t.completedAt} is not null)`,
    ),
    check(
      "assignment_submission_files_deleted_ck",
      sql`(${t.status} = 'DELETED') = (${t.deletedAt} is not null)`,
    ),
    check(
      "assignment_submission_files_submitted_ready_ck",
      sql`${t.submissionId} is null or ${t.status} in ('READY','DELETED')`,
    ),
  ],
);

export const projectResourceFiles = pgTable(
  "project_resource_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id),
    projectId: uuid("project_id").notNull(),
    /** Optional link to the project_resources row this file belongs to. */
    resourceId: uuid("resource_id"),
    uploaderMembershipId: uuid("uploader_membership_id").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    objectKey: text("object_key").notNull(),
    uploadTokenHash: varchar("upload_token_hash", { length: 64 }).notNull(),
    uploadExpiresAt: timestamp("upload_expires_at", { withTimezone: true }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    declaredContentType: varchar("declared_content_type", { length: 128 }).notNull(),
    declaredSizeBytes: bigint("declared_size_bytes", { mode: "number" }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("UPLOADING"),
    objectGeneration: text("object_generation"),
    verifiedContentType: varchar("verified_content_type", { length: 128 }),
    verifiedSizeBytes: bigint("verified_size_bytes", { mode: "number" }),
    sha256Hex: varchar("sha256_hex", { length: 64 }),
    scanStatus: varchar("scan_status", { length: 16 }).notNull().default("PENDING"),
    scanAttestedBy: varchar("scan_attested_by", { length: 80 }),
    scanAttestedAt: timestamp("scan_attested_at", { withTimezone: true }),
    failureCode: varchar("failure_code", { length: 64 }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedByUserId: uuid("deleted_by_user_id").references(() => users.id),
  },
  (t) => [
    uniqueIndex("project_resource_files_object_key_uq").on(t.objectKey),
    index("project_resource_files_project_status_idx").on(t.projectId, t.status),
    index("project_resource_files_resource_idx").on(t.resourceId),
    index("project_resource_files_college_status_idx").on(t.collegeId, t.status),
    foreignKey({
      name: "project_resource_files_project_college_fk",
      columns: [t.projectId, t.collegeId],
      foreignColumns: [projectInstances.id, projectInstances.collegeId],
    }),
    foreignKey({
      name: "project_resource_files_resource_project_fk",
      columns: [t.resourceId, t.projectId],
      foreignColumns: [projectResources.id, projectResources.projectId],
    }),
    foreignKey({
      name: "project_resource_files_uploader_college_fk",
      columns: [t.uploaderMembershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }),
    check("project_resource_files_status_ck", sql`${t.status} in (${sql.raw(FILE_STATUSES)})`),
    check("project_resource_files_scan_status_ck", sql`${t.scanStatus} in (${sql.raw(SCAN_STATUSES)})`),
    check(
      "project_resource_files_declared_size_ck",
      sql`${t.declaredSizeBytes} between 1 and ${sql.raw(String(MAX_FILE_BYTES))}`,
    ),
    check(
      "project_resource_files_verified_size_ck",
      sql`${t.verifiedSizeBytes} is null or ${t.verifiedSizeBytes} between 1 and ${sql.raw(String(MAX_FILE_BYTES))}`,
    ),
    check(
      "project_resource_files_content_type_ck",
      sql`length(trim(${t.declaredContentType})) between 3 and 128 and position('/' in ${t.declaredContentType}) > 1`,
    ),
    check(
      "project_resource_files_name_ck",
      sql`length(trim(${t.originalName})) between 1 and 255 and ${t.originalName} !~ '[/\\\\]' and trim(${t.originalName}) not in ('.', '..')`,
    ),
    check("project_resource_files_title_ck", sql`length(trim(${t.title})) between 1 and 200`),
    check(
      "project_resource_files_token_hash_ck",
      sql`${t.uploadTokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "project_resource_files_sha_ck",
      sql`${t.sha256Hex} is null or ${t.sha256Hex} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "project_resource_files_object_key_ck",
      sql`${t.objectKey} like ('private/' || ${t.collegeId}::text || '/' || ${t.uploaderMembershipId}::text || '/project-resource/%')`,
    ),
    check(
      "project_resource_files_ready_ck",
      sql`${t.status} <> 'READY' or (${t.scanStatus} = 'CLEAN' and ${t.scanAttestedBy} is not null and ${t.scanAttestedAt} is not null and ${t.objectGeneration} ~ '^[0-9]+$' and ${t.verifiedSizeBytes} is not null and ${t.verifiedContentType} is not null and ${t.completedAt} is not null)`,
    ),
    check(
      "project_resource_files_deleted_ck",
      sql`(${t.status} = 'DELETED') = (${t.deletedAt} is not null)`,
    ),
  ],
);

export const lessonVideoAssets = pgTable(
  "lesson_video_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => courseLessons.id),
    /** Null means every delivery of the offering (college administrators only). */
    deliveryId: uuid("delivery_id").references(() => courseSectionDeliveries.id),
    /** Optional VIDEO lesson content row this asset backs. */
    lessonContentId: uuid("lesson_content_id").references(() => lessonContents.id),
    uploaderMembershipId: uuid("uploader_membership_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    sequence: integer("sequence").notNull().default(0),
    publishStatus: varchar("publish_status", { length: 16 }).notNull().default("DRAFT"),
    visibleToStudents: boolean("visible_to_students").notNull().default(true),
    processingStatus: varchar("processing_status", { length: 16 }).notNull().default("UPLOADING"),
    durationSeconds: integer("duration_seconds"),
    objectKey: text("object_key").notNull(),
    uploadTokenHash: varchar("upload_token_hash", { length: 64 }).notNull(),
    uploadExpiresAt: timestamp("upload_expires_at", { withTimezone: true }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    declaredContentType: varchar("declared_content_type", { length: 128 }).notNull(),
    declaredSizeBytes: bigint("declared_size_bytes", { mode: "number" }).notNull(),
    objectGeneration: text("object_generation"),
    verifiedContentType: varchar("verified_content_type", { length: 128 }),
    verifiedSizeBytes: bigint("verified_size_bytes", { mode: "number" }),
    scanStatus: varchar("scan_status", { length: 16 }).notNull().default("PENDING"),
    scanAttestedBy: varchar("scan_attested_by", { length: 80 }),
    scanAttestedAt: timestamp("scan_attested_at", { withTimezone: true }),
    thumbnailStatus: varchar("thumbnail_status", { length: 16 }).notNull().default("NONE"),
    thumbnailObjectKey: text("thumbnail_object_key"),
    thumbnailUploadTokenHash: varchar("thumbnail_upload_token_hash", { length: 64 }),
    thumbnailUploadExpiresAt: timestamp("thumbnail_upload_expires_at", { withTimezone: true }),
    thumbnailContentType: varchar("thumbnail_content_type", { length: 128 }),
    thumbnailSizeBytes: integer("thumbnail_size_bytes"),
    thumbnailGeneration: text("thumbnail_generation"),
    /** Set while this asset is the pending replacement of another asset. */
    replacesAssetId: uuid("replaces_asset_id"),
    failureCode: varchar("failure_code", { length: 64 }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedByUserId: uuid("deleted_by_user_id").references(() => users.id),
  },
  (t) => [
    uniqueIndex("lesson_video_assets_object_key_uq").on(t.objectKey),
    uniqueIndex("lesson_video_assets_thumbnail_key_uq")
      .on(t.thumbnailObjectKey)
      .where(sql`${t.thumbnailObjectKey} is not null`),
    index("lesson_video_assets_lesson_delivery_idx").on(
      t.lessonId,
      t.deliveryId,
      t.sequence,
    ),
    index("lesson_video_assets_content_idx").on(t.lessonContentId),
    index("lesson_video_assets_college_status_idx").on(t.collegeId, t.processingStatus),
    foreignKey({
      name: "lesson_video_assets_uploader_college_fk",
      columns: [t.uploaderMembershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }),
    foreignKey({
      name: "lesson_video_assets_replaces_fk",
      columns: [t.replacesAssetId],
      foreignColumns: [t.id],
    }),
    check("lesson_video_assets_title_ck", sql`length(trim(${t.title})) between 1 and 255`),
    check("lesson_video_assets_sequence_ck", sql`${t.sequence} >= 0`),
    check(
      "lesson_video_assets_publish_status_ck",
      sql`${t.publishStatus} in ('DRAFT','PUBLISHED','ARCHIVED')`,
    ),
    check(
      "lesson_video_assets_processing_status_ck",
      sql`${t.processingStatus} in ('UPLOADING','PROCESSING','READY','FAILED','BLOCKED')`,
    ),
    check("lesson_video_assets_scan_status_ck", sql`${t.scanStatus} in (${sql.raw(SCAN_STATUSES)})`),
    check(
      "lesson_video_assets_thumbnail_status_ck",
      sql`${t.thumbnailStatus} in ('NONE','UPLOADING','READY')`,
    ),
    check(
      "lesson_video_assets_duration_ck",
      sql`${t.durationSeconds} is null or ${t.durationSeconds} between 1 and 86400`,
    ),
    check(
      "lesson_video_assets_declared_size_ck",
      sql`${t.declaredSizeBytes} between 1 and ${sql.raw(String(MAX_VIDEO_BYTES))}`,
    ),
    check(
      "lesson_video_assets_verified_size_ck",
      sql`${t.verifiedSizeBytes} is null or ${t.verifiedSizeBytes} between 1 and ${sql.raw(String(MAX_VIDEO_BYTES))}`,
    ),
    check(
      "lesson_video_assets_content_type_ck",
      sql`${t.declaredContentType} like 'video/%' and length(trim(${t.declaredContentType})) between 7 and 128`,
    ),
    check(
      "lesson_video_assets_name_ck",
      sql`length(trim(${t.originalName})) between 1 and 255 and ${t.originalName} !~ '[/\\\\]' and trim(${t.originalName}) not in ('.', '..')`,
    ),
    check(
      "lesson_video_assets_token_hash_ck",
      sql`${t.uploadTokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "lesson_video_assets_object_key_ck",
      sql`${t.objectKey} like ('private/' || ${t.collegeId}::text || '/' || ${t.uploaderMembershipId}::text || '/lesson-video/%')`,
    ),
    check(
      "lesson_video_assets_thumbnail_shape_ck",
      sql`(${t.thumbnailStatus} = 'NONE' and ${t.thumbnailObjectKey} is null and ${t.thumbnailContentType} is null and ${t.thumbnailSizeBytes} is null) or (${t.thumbnailStatus} <> 'NONE' and ${t.thumbnailObjectKey} is not null and ${t.thumbnailUploadTokenHash} ~ '^[0-9a-f]{64}$' and ${t.thumbnailContentType} in ('image/jpeg','image/png','image/webp') and ${t.thumbnailSizeBytes} between 1 and ${sql.raw(String(MAX_THUMBNAIL_BYTES))} and ${t.thumbnailObjectKey} like ('private/' || ${t.collegeId}::text || '/' || ${t.uploaderMembershipId}::text || '/lesson-video/%'))`,
    ),
    check(
      "lesson_video_assets_thumbnail_ready_ck",
      sql`${t.thumbnailStatus} <> 'READY' or ${t.thumbnailGeneration} ~ '^[0-9]+$'`,
    ),
    check(
      "lesson_video_assets_ready_ck",
      sql`${t.processingStatus} <> 'READY' or (${t.scanStatus} = 'CLEAN' and ${t.scanAttestedBy} is not null and ${t.scanAttestedAt} is not null and ${t.objectGeneration} ~ '^[0-9]+$' and ${t.verifiedSizeBytes} is not null and ${t.verifiedContentType} is not null and ${t.completedAt} is not null)`,
    ),
    check(
      "lesson_video_assets_published_ready_ck",
      sql`${t.publishStatus} <> 'PUBLISHED' or ${t.processingStatus} = 'READY'`,
    ),
    check(
      "lesson_video_assets_replaces_self_ck",
      sql`${t.replacesAssetId} is null or ${t.replacesAssetId} <> ${t.id}`,
    ),
  ],
);

export const storageFileEvents = pgTable(
  "storage_file_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id),
    subjectKind: varchar("subject_kind", { length: 32 }).notNull(),
    subjectId: uuid("subject_id").notNull(),
    eventType: varchar("event_type", { length: 40 }).notNull(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id),
    actorMembershipId: uuid("actor_membership_id"),
    /** Safe, non-secret context only (sizes, statuses). Never URLs or tokens. */
    detail: jsonb("detail").notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("storage_file_events_subject_idx").on(t.subjectKind, t.subjectId, t.occurredAt),
    index("storage_file_events_college_time_idx").on(t.collegeId, t.occurredAt),
    index("storage_file_events_actor_idx").on(t.actorUserId, t.occurredAt),
    foreignKey({
      name: "storage_file_events_actor_membership_college_fk",
      columns: [t.actorMembershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }),
    check(
      "storage_file_events_subject_kind_ck",
      sql`${t.subjectKind} in ('ASSIGNMENT_SUBMISSION_FILE','PROJECT_RESOURCE_FILE','LESSON_VIDEO')`,
    ),
    check(
      "storage_file_events_event_type_ck",
      sql`${t.eventType} in ('UPLOAD_GRANTED','UPLOAD_COMPLETED','UPLOAD_FAILED','SCAN_ATTESTED','SCAN_REJECTED','DOWNLOAD_GRANTED','PLAYBACK_GRANTED','THUMBNAIL_GRANTED','THUMBNAIL_COMPLETED','SUBMITTED','UPDATED','PUBLISHED','UNPUBLISHED','REPLACED','DELETED')`,
    ),
    check("storage_file_events_detail_ck", sql`jsonb_typeof(${t.detail}) = 'object'`),
  ],
);

/** Import-only key/receipt translation. A crosswalk is never a download grant:
 * each native asset's owner, status and scan must be verified again on read.
 */
export const storageLegacyFileCrosswalks = pgTable(
  "storage_legacy_file_crosswalks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    ownerMembershipId: uuid("owner_membership_id").notNull(),
    nativeKind: varchar("native_kind", { length: 32 }).notNull(),
    nativeAssetId: uuid("native_asset_id").notNull(),
    legacyReceiptId: varchar("legacy_receipt_id", { length: 120 }),
    legacyObjectKeyMac: varchar("legacy_object_key_mac", { length: 64 }),
    legacyUploaderId: integer("legacy_uploader_id"),
    legacyUserType: varchar("legacy_user_type", { length: 24 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "storage_legacy_crosswalk_membership_college_fk",
      columns: [t.ownerMembershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    uniqueIndex("storage_legacy_crosswalk_receipt_uq")
      .on(t.collegeId, t.legacyReceiptId)
      .where(sql`${t.legacyReceiptId} is not null`),
    uniqueIndex("storage_legacy_crosswalk_key_uq")
      .on(t.collegeId, t.legacyObjectKeyMac)
      .where(sql`${t.legacyObjectKeyMac} is not null`),
    index("storage_legacy_crosswalk_asset_idx")
      .on(t.collegeId, t.nativeKind, t.nativeAssetId),
    check("storage_legacy_crosswalk_kind_ck",
      sql`${t.nativeKind} in ('ASSIGNMENT_SUBMISSION_FILE','PROJECT_RESOURCE_FILE','LESSON_VIDEO')`),
    check("storage_legacy_crosswalk_source_ck",
      sql`${t.legacyReceiptId} is not null or ${t.legacyObjectKeyMac} is not null`),
    check("storage_legacy_crosswalk_key_mac_ck",
      sql`${t.legacyObjectKeyMac} is null or ${t.legacyObjectKeyMac} ~ '^[a-f0-9]{64}$'`),
  ],
);

/** Legacy object keys are source evidence, NEVER signed URLs or vNext UUIDs.
 * The importer must compute an HMAC of each source key and insert a scoped
 * storageLegacyFileCrosswalks row; downloads recheck live owner/scan status.
 */
export type LegacyFileImportState =
  "UPLOADING" | "VERIFYING" | "READY" | "FAILED" | "QUARANTINED" | "DELETED";

export function legacyStorageImportState(input:{
  oldStatus:string;uploadExpiresAt:Date;scanAttestedClean:boolean;
  verifiedObjectGeneration:boolean;now:Date;
}):{status:LegacyFileImportState;reason:string}{
  const source=input.oldStatus.trim().toUpperCase();
  if(source==="DELETED"||source==="REMOVED")return {status:"DELETED",reason:"Source deleted"};
  if(source==="FAILED"||source==="ERROR")return {status:"FAILED",reason:"Source upload failed"};
  if(source==="QUARANTINED"||source==="REJECTED")return {status:"QUARANTINED",reason:"Source scan rejected"};
  if(input.scanAttestedClean&&input.verifiedObjectGeneration&&
    ["READY","VERIFIED","COMPLETE","COMPLETED"].includes(source))
    return {status:"READY",reason:"Object and clean scan independently verified"};
  if(input.uploadExpiresAt.getTime()<=input.now.getTime())
    return {status:"FAILED",reason:"Unverified upload receipt expired"};
  if(source==="UPLOADING"||source==="CREATED")return {status:"UPLOADING",reason:"Upload not yet verified"};
  return {status:"VERIFYING",reason:"Awaiting verification and scanning"};
}

/** Resource deletion is routed to an owner-scoped endpoint, never directly to R2. */
export function legacyStorageDeleteTarget(kind:string):string|null{
  switch(kind){
    case "ASSIGNMENT_SUBMISSION_FILE":return "assignment_submission_files";
    case "PROJECT_RESOURCE_FILE":return "project_resource_files";
    case "LESSON_VIDEO":return "lesson_video_assets";
    default:return null;
  }
}
export const LEGACY_FILE_UNAVAILABLE_COPY=
  "This file is no longer available. Ask your college to restore it.";
