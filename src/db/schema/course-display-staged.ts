/**
 * W02 DB05 staged schema only.
 * W01 owns migration registration and src/db/schema/index.ts.
 * Do not query this table unless DB05_COURSE_DISPLAY_READY=DB05_VERIFIED.
 */
import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { courses } from "./courses";
import { users } from "./users";

export const courseDisplayContents = pgTable(
  "course_display_contents",
  {
    courseId: uuid("course_id").primaryKey().references(() => courses.id, { onDelete: "cascade" }),
    introductionText: text("introduction_text"),
    bodyHtml: text("body_html"),
    takeaways: text("takeaways").array().notNull().default(sql`ARRAY[]::text[]`),
    thumbnailUrl: text("thumbnail_url"),
    version: integer("version").notNull().default(0),
    updatedByUserId: uuid("updated_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("course_display_contents_version_ck", sql`${table.version} >= 0`),
    check("course_display_contents_takeaways_count_ck", sql`cardinality(${table.takeaways}) <= 30`),
  ],
);
