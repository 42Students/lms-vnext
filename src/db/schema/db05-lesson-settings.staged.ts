/**
 * DB-008 / Chat 6 -- UNREGISTERED STAGED ONLY.
 *
 * Exact typed counterpart for scripts/sql/db05-lesson-content-settings.draft.sql.
 * Do not confuse the new settings with course status, lesson publish state,
 * DB06 assignment submission controls or signed private upload receipts.
 * The legacy ContentDataDTO has 17 nested fields; this table accounts for
 * only the nine metadata/settings fields, not all 17.
 *
 * W01 alone may export/register after source/API tenant and PostgreSQL tests.
 * No runtime import or schema-barrel modification is authorized yet.
 */
import { sql } from "drizzle-orm";
import {
  boolean, check, index, pgTable, text, timestamp, uuid, bigint,
} from "drizzle-orm/pg-core";
import { lessonContents } from "./courses";
import { users } from "./users";

export const lessonContentSettingsStaged = pgTable(
  "lesson_content_settings",
  {
    lessonContentId: uuid("lesson_content_id")
      .primaryKey()
      .references(() => lessonContents.id, { onDelete: "restrict" }),
    allowDiscussions: boolean("allow_discussions").notNull().default(false),
    viewAfterSchedule: boolean("view_after_schedule").notNull().default(false),
    viewBeforeSchedule: boolean("view_before_schedule").notNull().default(false),
    htmlContent: text("html_content"),
    plainText: text("plain_text"),
    // String in legacy ContentDataDTO; not DB06 assessment dueAt.
    legacyDueDateRaw: text("legacy_due_date_raw"),
    calendarEventId: text("calendar_event_id"),
    calendarTimeZone: text("calendar_time_zone"),
    thumbnailUrl: text("thumbnail_url"),
    version: bigint("version", { mode: "number" }).notNull().default(0),
    updatedByUserId: uuid("updated_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (table) => [
    check(
      "db05_lesson_content_settings_version_nonnegative_ck",
      sql`${table.version} >= 0`,
    ),
    index("db05_lesson_content_settings_updated_idx")
      .on(sql`${table.updatedAt} DESC`),
  ],
);
