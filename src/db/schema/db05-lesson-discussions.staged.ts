/**
 * DB-008 / chat-14 -- STAGED, pending journal review and security tests.
 *
 * Mirrors scripts/sql/db05-lesson-content-discussions.draft.sql.
 * This is not classroom/delivery chat (see discussions.ts).
 * Migration 0200 supplies the tenant guard, composite membership FKs and
 * server-trusted author snapshots. Lane 15 alone registers journal entries.
 * No runtime import/export until course access, attachment ACL, and
 * disposable PostgreSQL negative/race tests are complete.
 *
 * Lesson-content discussions are not delivery classroom chat. Historical
 * numeric user/content IDs map via college-scoped legacy_id_map, never a UUID
 * cast. The Drizzle schema alone does not execute the SQL scope trigger.
 */
import { sql } from "drizzle-orm";
import {
  boolean, check, foreignKey, index, integer, pgTable, text,
  timestamp, unique, uniqueIndex, uuid, varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { lessonContents } from "./courses";
import { collegeMemberships } from "./memberships";

export const lessonContentDiscussionsStaged = pgTable(
  "lesson_content_discussions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Optional, college-scoped provenance only (not the vNext API identifier).
    legacyDiscussionId: integer("legacy_discussion_id"),
    legacyClassId: integer("legacy_class_id"),
    legacyCourseId: integer("legacy_course_id"),
    legacyContentId: integer("legacy_content_id"),
    legacyParentDiscussionId: integer("legacy_parent_discussion_id"),
    legacySequence: integer("legacy_sequence"),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    lessonContentId: uuid("lesson_content_id")
      .notNull()
      .references(() => lessonContents.id, { onDelete: "restrict" }),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    // These names are overwritten from trusted identity by migration 0200.
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
    foreignKey({
      name: "lesson_content_discussions_author_college_fk",
      columns: [table.authorMembershipId, table.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    foreignKey({
      name: "lesson_content_discussions_resolver_college_fk",
      columns: [table.resolvedByMembershipId, table.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    uniqueIndex("lesson_content_discussions_legacy_college_id_uq")
      .on(table.collegeId, table.legacyDiscussionId)
      .where(sql`${table.legacyDiscussionId} is not null`),
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
    index("lesson_content_discussions_content_sequence_idx").on(table.lessonContentId,table.sequence,table.id)
      .where(sql`${table.deletedAt} is null`),
    index("lesson_content_discussions_author_idx")
      .on(table.authorMembershipId, sql`${table.createdAt} DESC`),
    index("lesson_content_discussions_parent_idx")
      .on(table.parentDiscussionId)
      .where(sql`${table.parentDiscussionId} is not null`),
  ],
);

/** Stage-only importer. Source numeric lesson/class IDs MUST resolve through
 * the selected college; never infer content from a source parent ID alone. */
export const LEGACY_LESSON_DISCUSSION_TEXT_MAX=5000;

export function legacyLessonDiscussionInputError(text:string):string|null{
  const length=text.trim().length;
  return length===0?"Enter a comment.":length>LEGACY_LESSON_DISCUSSION_TEXT_MAX
    ?"Comment must be 5,000 characters or fewer.":null;
}

export type LegacyLessonDiscussionImport = {
  legacyDiscussionId:number;legacyContentId:number;legacyParentId:number|null;
  sequence:number|null;createdAt:Date;
};

export function mapLegacyLessonDiscussions(
  rows:readonly LegacyLessonDiscussionImport[],
  contentIdMap:ReadonlyMap<number,string>,
  discussionIdMap:ReadonlyMap<number,string>,
){
  const mapped:Array<{legacyDiscussionId:number;lessonContentId:string;
    parentDiscussionId:string|null;sequence:number;createdAt:Date}>=[];
  const unresolved:number[]=[];
  // Parent references must resolve inside the same content scope. A map of
  // discussion UUIDs alone cannot prove this; reconcile all source rows in
  // one college-scoped batch before accepting a reply.
  const sourceContentByDiscussion=new Map<number,number>();
  const duplicateIds=new Set<number>();
  for(const row of rows){
    if(sourceContentByDiscussion.has(row.legacyDiscussionId))
      duplicateIds.add(row.legacyDiscussionId);
    sourceContentByDiscussion.set(row.legacyDiscussionId,row.legacyContentId);
  }
  const sorted=[...rows].sort((a,b)=>(a.sequence??Number.MAX_SAFE_INTEGER)-
    (b.sequence??Number.MAX_SAFE_INTEGER)||
    a.createdAt.getTime()-b.createdAt.getTime()||
    a.legacyDiscussionId-b.legacyDiscussionId);
  sorted.forEach((row,index)=>{
    const content=contentIdMap.get(row.legacyContentId);
    const parent=row.legacyParentId===null?null:discussionIdMap.get(row.legacyParentId);
    if(duplicateIds.has(row.legacyDiscussionId)||
       (row.sequence!==null&&(!Number.isSafeInteger(row.sequence)||row.sequence<0))||
       !Number.isSafeInteger(row.legacyDiscussionId)||row.legacyDiscussionId<=0||
       !Number.isSafeInteger(row.legacyContentId)||row.legacyContentId<=0||
       !Number.isFinite(row.createdAt.getTime())||
       (row.legacyParentId!==null&&(
         !Number.isSafeInteger(row.legacyParentId)||row.legacyParentId<=0||
         row.legacyParentId===row.legacyDiscussionId||
         sourceContentByDiscussion.get(row.legacyParentId)!==row.legacyContentId))||
       !content||(row.legacyParentId!==null&&!parent)){
      unresolved.push(row.legacyDiscussionId);return;
    }
    mapped.push({legacyDiscussionId:row.legacyDiscussionId,lessonContentId:content,
      parentDiscussionId:parent??null,sequence:row.sequence??index+1,createdAt:row.createdAt});
  });
  return {mapped,unresolved};
}
