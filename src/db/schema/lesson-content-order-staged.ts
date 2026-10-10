/** W02 DB05 staged only; W01 owns migration registration/index export. */
import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { courseSectionDeliveries, lessonContents } from "./courses";
import { users } from "./users";

export const lessonContentDeliverySequences = pgTable(
  "lesson_content_delivery_sequences",
  {
    lessonContentId: uuid("lesson_content_id").notNull().references(() => lessonContents.id, { onDelete: "cascade" }),
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
  ],
);
