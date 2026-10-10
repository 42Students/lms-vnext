/** W02 DB05 staged only; W01 owns migration registration/index export. */
import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
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
  },
  (table) => [
    uniqueIndex("lesson_content_materials_content_sequence_uq").on(table.lessonContentId, table.sequence),
    uniqueIndex("lesson_content_materials_storage_key_uq").on(table.storageKey).where(sql`${table.storageKey} is not null`),
    index("lesson_content_materials_content_kind_idx").on(table.lessonContentId, table.kind),
    check("lesson_content_materials_kind_ck", sql`${table.kind} in (\'LINK\', \'FILE\')`),
    check("lesson_content_materials_sequence_ck", sql`${table.sequence} >= 0`),
    check("lesson_content_materials_size_ck", sql`${table.sizeBytes} is null or (${table.sizeBytes} > 0 and ${table.sizeBytes} <= 52428800)`),
    check("lesson_content_materials_shape_ck", sql`(${table.kind} = \'LINK\' and ${table.externalUrl} is not null and ${table.storageKey} is null and ${table.originalName} is null and ${table.mimeType} is null and ${table.sizeBytes} is null) or (${table.kind} = \'FILE\' and ${table.externalUrl} is null and ${table.storageKey} is not null and ${table.originalName} is not null and ${table.mimeType} is not null and ${table.sizeBytes} is not null)`),
  ],
);
