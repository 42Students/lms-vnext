/** Lesson content materials (LINK/FILE) with upload/scan lifecycle. Migration 0127. */
import { sql } from "drizzle-orm";
import { check, bigint, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { lessonContents } from "./courses";
import { users } from "./users";

export const lessonContentMaterials = pgTable(
  "lesson_content_materials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonContentId: uuid("lesson_content_id").notNull().references(() => lessonContents.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    externalUrl: text("external_url"),
    storageKey: text("storage_key"),
    originalName: text("original_name"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    sequence: integer("sequence").notNull(),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    /** Legacy arrays are decoded by a trusted importer, never directly exposed. */
    legacySourceContentId: integer("legacy_source_content_id"),
    legacyItemIndex: integer("legacy_item_index"),
    legacyFileMetadata: jsonb("legacy_file_metadata")
      .$type<{ fileName?: string; contentType?: string; sourceKind?: "FILE" | "LINK" }>(),
    uploadStatus: text("upload_status").notNull().default("READY"),
    uploadTokenHash: varchar("upload_token_hash",{length:64}),
    uploadExpiresAt: timestamp("upload_expires_at",{withTimezone:true}),
    objectGeneration: text("object_generation"),
    scanStatus: varchar("scan_status",{length:16}).notNull().default("PENDING"),
    scanAttestedBy: varchar("scan_attested_by",{length:80}),
    scanAttestedAt: timestamp("scan_attested_at",{withTimezone:true}),
    verifiedSizeBytes: bigint("verified_size_bytes",{mode:"number"}),
    verifiedContentType: varchar("verified_content_type",{length:128}),
    completedAt: timestamp("completed_at",{withTimezone:true}),
    failureCode: varchar("failure_code",{length:64}),
  },
  (table) => [
    uniqueIndex("lesson_content_materials_content_sequence_uq").on(table.lessonContentId, table.sequence),
    uniqueIndex("lesson_content_materials_storage_key_uq").on(table.storageKey).where(sql`${table.storageKey} is not null`),
    index("lesson_content_materials_content_kind_idx").on(table.lessonContentId, table.kind),
    check("lesson_content_materials_kind_ck", sql`${table.kind} in (\'LINK\', \'FILE\')`),
    check("lesson_content_materials_sequence_ck", sql`${table.sequence} >= 0`),
    check("lesson_content_materials_legacy_item_ck",
      sql`${table.legacyItemIndex} is null or ${table.legacyItemIndex} >= 0`),
    check("lesson_content_materials_size_ck", sql`${table.sizeBytes} is null or (${table.sizeBytes} > 0 and ${table.sizeBytes} <= 52428800)`),
    check("lesson_content_materials_upload_status_ck", sql`${table.uploadStatus} in ('UPLOADING','VERIFYING','READY','QUARANTINED','FAILED','DELETED')`),
    check("lesson_content_materials_scan_status_ck", sql`${table.scanStatus} in ('PENDING','CLEAN','REJECTED')`),
    check("lesson_content_materials_ready_ck", sql`${table.kind} <> 'FILE' or ${table.uploadStatus} <> 'READY' or (${table.scanStatus} = 'CLEAN' and ${table.scanAttestedBy} is not null and ${table.scanAttestedAt} is not null and ${table.objectGeneration} is not null and ${table.verifiedSizeBytes} between 1 and 52428800 and ${table.verifiedContentType} is not null and ${table.completedAt} is not null)`),
    check("lesson_content_materials_shape_ck", sql`(${table.kind} = \'LINK\' and ${table.externalUrl} is not null and ${table.storageKey} is null and ${table.originalName} is null and ${table.mimeType} is null and ${table.sizeBytes} is null) or (${table.kind} = \'FILE\' and ${table.externalUrl} is null and ${table.storageKey} is not null and ${table.originalName} is not null and ${table.mimeType} is not null and ${table.sizeBytes} is not null)`),
  ],
);

/** Server-validated file metadata contract for the old resource composer.
 * This does NOT attest a GCS object or virus scan; the upload completion
 * service must verify bytes, generation, clean scan and ownership separately. */
export const LESSON_MATERIAL_FILE_LIMIT_BYTES = 50 * 1024 * 1024;
export const LESSON_MATERIAL_MAX_ITEMS = 20;
export const LESSON_MATERIAL_ALLOWED_EXTENSIONS = [
  "pdf","doc","docx","ppt","pptx","xls","xlsx","txt","csv",
  "png","jpg","jpeg","gif","webp","zip",
] as const;

export function lessonMaterialFileInputError(
  input: { name: string; size: number },
  existingCount: number,
): string | null {
  if (!Number.isSafeInteger(existingCount) || existingCount < 0 ||
      existingCount >= LESSON_MATERIAL_MAX_ITEMS)
    return "You can add up to 20 materials.";
  if (!Number.isSafeInteger(input.size) || input.size <= 0 ||
      input.size > LESSON_MATERIAL_FILE_LIMIT_BYTES)
    return "Each file must be 50 MB or smaller.";
  const filename = input.name.trim();
  if (filename.length < 3 || filename.length > 255 ||
      filename.includes("/") || filename.includes("\\") ||
      filename.includes("\0"))
    return "Enter a valid file name.";
  const extension = filename.split(".").at(-1)?.toLowerCase();
  if (!extension || !LESSON_MATERIAL_ALLOWED_EXTENSIONS.some(item => item === extension))
    return "This file type is not supported.";
  return null;
}
