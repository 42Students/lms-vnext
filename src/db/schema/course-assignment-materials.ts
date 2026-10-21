import {sql} from "drizzle-orm";
import {bigint,check,index,jsonb,pgTable,text,timestamp,uniqueIndex,uuid,varchar,integer} from "drizzle-orm/pg-core";
import {courseAssignments} from "./assessments";
import {users} from "./users";
/** LEARNER-course-detail-03 / LEARNER-learning-misc-02.
 * Instructor-owned LINK or verified FILE; Drive source is provenance only. */
export const courseAssignmentMaterials=pgTable("course_assignment_materials",{
 id:uuid("id").defaultRandom().primaryKey(),
 assignmentId:uuid("assignment_id").notNull().references(()=>courseAssignments.id,{onDelete:"restrict"}),
 kind:varchar("kind",{length:12}).notNull().default("LINK"),
 title:text("title").notNull(),
 externalUrl:text("external_url"),
 source:varchar("source",{length:12}).notNull().default("DIRECT"),
 storageKey:text("storage_key"),
 originalName:varchar("original_name",{length:255}),
 mimeType:varchar("mime_type",{length:128}),
 sizeBytes:bigint("size_bytes",{mode:"number"}),
 uploadStatus:varchar("upload_status",{length:16}).notNull().default("READY"),
 uploadTokenHash:varchar("upload_token_hash",{length:64}),
 uploadExpiresAt:timestamp("upload_expires_at",{withTimezone:true}),
 objectGeneration:text("object_generation"),
 scanStatus:varchar("scan_status",{length:16}).notNull().default("PENDING"),
 scanAttestedBy:varchar("scan_attested_by",{length:80}),
 scanAttestedAt:timestamp("scan_attested_at",{withTimezone:true}),
 verifiedSizeBytes:bigint("verified_size_bytes",{mode:"number"}),
 verifiedContentType:varchar("verified_content_type",{length:128}),
 completedAt:timestamp("completed_at",{withTimezone:true}),
 failureCode:varchar("failure_code",{length:64}),
 legacyFileDto:jsonb("legacy_file_dto").$type<Record<string,unknown>>(),
 sequence:integer("sequence").notNull(),
 createdByUserId:uuid("created_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[
 index("course_assignment_materials_parent_idx").on(table.assignmentId),
 uniqueIndex("course_assignment_materials_sequence_uq").on(table.assignmentId,table.sequence),
 check("course_assignment_materials_kind_ck",sql`${table.kind} in ('LINK','FILE')`),
 check("course_assignment_materials_source_ck",sql`${table.source} in ('DIRECT','DRIVE')`),
 check("course_assignment_materials_title_ck",sql`length(trim(${table.title})) between 1 and 160`),
 check("course_assignment_materials_shape_ck",sql`(${table.kind} = 'LINK' and ${table.externalUrl} is not null and ${table.storageKey} is null) or (${table.kind} = 'FILE' and ${table.externalUrl} is null and ${table.storageKey} is not null and ${table.originalName} is not null and ${table.mimeType} is not null and ${table.sizeBytes} is not null)`),
 check("course_assignment_materials_url_ck",sql`${table.externalUrl} is null or (${table.externalUrl} ~ '^https://[^[:space:]]+$' and length(${table.externalUrl}) between 10 and 2048)`),
 check("course_assignment_materials_size_ck",sql`${table.sizeBytes} is null or ${table.sizeBytes} between 1 and 52428800`),
 check("course_assignment_materials_upload_status_ck",sql`${table.uploadStatus} in ('UPLOADING','VERIFYING','READY','QUARANTINED','FAILED','DELETED')`),
 check("course_assignment_materials_scan_ck",sql`${table.scanStatus} in ('PENDING','CLEAN','REJECTED')`),
 check("course_assignment_materials_file_ready_ck",sql`${table.kind} <> 'FILE' or ${table.uploadStatus} <> 'READY' or (${table.scanStatus} = 'CLEAN' and ${table.scanAttestedBy} is not null and ${table.scanAttestedAt} is not null and ${table.objectGeneration} ~ '^[0-9]+$' and ${table.verifiedSizeBytes} between 1 and 52428800 and ${table.verifiedContentType} is not null and ${table.completedAt} is not null)`),
 check("course_assignment_materials_sequence_ck",sql`${table.sequence} between 0 and 19`),
]);
