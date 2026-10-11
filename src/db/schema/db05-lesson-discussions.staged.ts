/**
 * DB-008 / Chat 6 -- UNREGISTERED STAGED ONLY.
 *
 * Mirrors scripts/sql/db05-lesson-content-discussions.draft.sql.
 * This is not classroom/delivery chat (see discussions.ts).
 * Chat 1 alone registers the numbered migration and schema barrel export.
 * Do NOT import into runtime APIs until tenant scope, attachment ACL, parent
 * semantics and real PostgreSQL negatives have passed.
 *
 * NOTE: Composite parent FK only proves same content ID; separate SQL
 * db05-lesson-discussions-same-college.draft.sql replaces the tenant trigger
 * to compare content, course department, period, delivery and author scope.
 * Neither a Drizzle FK nor an index executes that trigger.
 */
import { sql } from "drizzle-orm";
import {
  boolean, check, foreignKey, index, integer, pgTable, text,
  timestamp, unique, uuid, varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { lessonContents } from "./courses";
import { collegeMemberships } from "./memberships";

export const lessonContentDiscussionsStaged = pgTable(
  "lesson_content_discussions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    lessonContentId: uuid("lesson_content_id")
      .notNull()
      .references(() => lessonContents.id, { onDelete: "restrict" }),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    authorUniqueNameSnapshot: text("author_unique_name_snapshot"),
    authorProfileNameSnapshot: text("author_profile_name_snapshot"),
    contentText: text("content_text").notNull(),
    sequence: integer("sequence").notNull().default(0),
    // Historical snapshot-only extensions. No vNext runtime contract yet.
    parentDiscussionId: uuid("parent_discussion_id"),
    discussionStatus: varchar("discussion_status", { length: 20 }),
    isFacultyAnswer: boolean("is_faculty_answer"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedByMembershipId: uuid("resolved_by_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    attachmentObjectKey: text("attachment_object_key"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (table) => [
    check(
      "lesson_content_discussions_text_ck",
      sql`length(btrim(${table.contentText})) BETWEEN 1 AND 5000`,
    ),
    check(
      "lesson_content_discussions_parent_not_self_ck",
      sql`${table.parentDiscussionId} is null or ${table.parentDiscussionId} <> ${table.id}`,
    ),
    unique("lesson_content_discussions_id_content_uq")
      .on(table.id, table.lessonContentId),
    foreignKey({
      name: "lesson_content_discussions_parent_content_fk",
      columns: [table.parentDiscussionId, table.lessonContentId],
      foreignColumns: [table.id, table.lessonContentId],
    }).onDelete("restrict"),
    index("lesson_content_discussions_content_created_idx")
      .on(table.lessonContentId, table.createdAt, table.id)
      .where(sql`${table.deletedAt} is null`),
    index("lesson_content_discussions_author_idx")
      .on(table.authorMembershipId, sql`${table.createdAt} DESC`),
    index("lesson_content_discussions_parent_idx")
      .on(table.parentDiscussionId)
      .where(sql`${table.parentDiscussionId} is not null`),
  ],
);
