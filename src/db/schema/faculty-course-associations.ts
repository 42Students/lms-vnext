import { sql } from "drizzle-orm";
import { check, index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { collegeMemberships } from "./memberships";
import { courses } from "./courses";

/**
 * Historical FacultyCourseAssociation.active=1 maps to endedAt IS NULL;
 * active=0 maps to endedAt with an audited effective timestamp. Legacy
 * integer faculty/course/association IDs require verified UUID crosswalk and
 * tenant-scoped faculty membership, not an int-to-UUID cast. Before a future
 * import, group duplicate active faculty/course pairs, retain the original
 * events in history, then choose a single authorized live association.
 * Greenfield vNext has no legacy rows to backfill or activate automatically.
 */
export const facultyCourseAssociations = pgTable("faculty_course_associations", {
  id: uuid("id").defaultRandom().primaryKey(),
  membershipId: uuid("membership_id").notNull().references(() => collegeMemberships.id, { onDelete: "restrict" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("faculty_course_associations_active_uq").on(t.membershipId, t.courseId).where(sql`${t.endedAt} is null`),
  index("faculty_course_associations_course_active_idx").on(t.courseId, t.membershipId).where(sql`${t.endedAt} is null`),
  check("faculty_course_associations_lifecycle_ck", sql`${t.endedAt} is null or ${t.endedAt} >= ${t.startedAt}`),
]);
