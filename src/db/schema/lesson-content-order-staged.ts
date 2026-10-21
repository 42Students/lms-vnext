/** W02 DB05 staged only; W01 owns migration registration/index export. */
import { sql } from "drizzle-orm";
import { bigint, check, index, integer, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { courseSectionDeliveries, lessonContents } from "./courses";
import { users } from "./users";

export const lessonContentDeliverySequences = pgTable(
  "lesson_content_delivery_sequences",
  {
    lessonContentId: uuid("lesson_content_id").notNull().references(() => lessonContents.id, { onDelete: "cascade" }),
    // Witness the lesson of the referenced content. W01 registers the paired
    // (lesson_content_id,lesson_id) FK and per-lesson/delivery UNIQUE in SQL.
    // There is deliberately NO standalone lessonId FK here: the composite
    // FK, not two independent FKs, enforces actual ownership.
    lessonId: uuid("lesson_id").notNull(),
    /** Source MySQL class/lesson-content numeric keys are import-only snapshots. */
    legacyClassId: bigint("legacy_class_id", { mode: "bigint" }),
    legacyLessonContentId: bigint("legacy_lesson_content_id", { mode: "bigint" }),
    legacySequence: bigint("legacy_sequence", { mode: "bigint" }),
    deliveryId: uuid("delivery_id").notNull().references(() => courseSectionDeliveries.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    updatedByUserId: uuid("updated_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.lessonContentId, table.deliveryId], name: "lesson_content_delivery_sequences_pk" }),
    index("lesson_content_delivery_sequences_delivery_sequence_idx").on(table.deliveryId, table.sequence),
    check("lesson_content_delivery_sequences_sequence_ck", sql`${table.sequence} >= 0`),
    index("lesson_content_delivery_sequences_source_class_idx")
      .on(table.legacyClassId, table.legacyLessonContentId),
    check("lesson_content_delivery_sequences_legacy_sequence_ck",
      sql`${table.legacySequence} is null or ${table.legacySequence} >= 0`),
  ],
);

/** Import rows only when both source identifiers belong to the same offering. */
export type LegacyLessonSequenceSource={
 classId:bigint;contentId:bigint;sequence:bigint;lessonId:string;
};
export function mapLegacyLessonDeliveryOrder(
 source:LegacyLessonSequenceSource,
 scopedClassMap:ReadonlyMap<bigint,{deliveryId:string;lessonId:string}>,
 scopedContentMap:ReadonlyMap<bigint,{lessonContentId:string;lessonId:string}>,
):{deliveryId:string;lessonContentId:string;lessonId:string;sequence:number}|null {
 const delivery=scopedClassMap.get(source.classId);
 const content=scopedContentMap.get(source.contentId);
 if(!delivery||!content||delivery.lessonId!==source.lessonId||
    content.lessonId!==source.lessonId)return null;
 if(source.sequence<0n||source.sequence>2147483647n)return null;
 return {deliveryId:delivery.deliveryId,lessonContentId:content.lessonContentId,
    lessonId:source.lessonId,sequence:Number(source.sequence)};
}
