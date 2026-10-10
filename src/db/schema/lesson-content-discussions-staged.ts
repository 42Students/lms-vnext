/**
 * DB-008 / DB05 staged schema only.
 *
 * Legacy source evidence (BE 21bad59d4dfaf2fa11fdeaf9353327ce105697d5):
 * - DiscussionController scopes reads/writes to a lesson_content_id.
 * - DiscussionServiceImpl persists authenticated author identity plus display snapshots.
 * - DiscussionRepository fetches a separate lesson-content discussion stream.
 *
 * This is intentionally NOT course_discussion_messages. That existing table models
 * course/class classroom chat and must not absorb per-content discussion history.
 *
 * Chat 1 owns migration registration and src/db/schema/index.ts. Do not query this
 * table from runtime code until the DB05 migration + tenant-negative acceptance gate
 * is explicitly complete.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { lessonContents } from "./courses";
import { collegeMemberships } from "./memberships";

export const lessonContentDiscussions = pgTable(
  "lesson_content_discussions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonContentId: uuid("lesson_content_id")
      .notNull()
      .references(() => lessonContents.id, {
        onDelete: "restrict",
      }),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    authorHandleSnapshot: text("author_handle_snapshot"),
    authorDisplayNameSnapshot: text("author_display_name_snapshot"),
    contentText: text("content_text").notNull(),
    sequence: integer("sequence").notNull().default(0),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("lesson_content_discussions_content_created_idx").on(
      table.lessonContentId,
      table.createdAt,
    ),
    index("lesson_content_discussions_author_idx").on(
      table.authorMembershipId,
    ),
    check(
      "lesson_content_discussions_text_ck",
      sql`length(trim(${table.contentText})) between 1 and 5000`,
    ),
  ],
);
