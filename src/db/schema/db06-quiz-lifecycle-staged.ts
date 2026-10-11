/**
 * DB-052 / DB06 SOURCE-ONLY staging.
 *
 * DO NOT export from src/db/schema/index.ts and do not assume this table exists
 * until the lifecycle producer cutover and numbered migration are integrated.
 *
 * Existing rows may receive an actorless BASELINE event at migration time.
 * Every runtime CREATE/transition/results event requires a real actor.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { courseSectionDeliveries } from "./courses";
import { courseQuizzes } from "./quizzes";
import { users } from "./users";

export const courseQuizLifecycleEventsStaged = pgTable(
  "course_quiz_lifecycle_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => courseQuizzes.id, {
        onDelete: "restrict",
      }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, {
        onDelete: "restrict",
      }),
    deliveryId: uuid("delivery_id").references(
      () => courseSectionDeliveries.id,
      { onDelete: "restrict" },
    ),
    actorUserId: uuid("actor_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    actorMembershipId: uuid(
      "actor_membership_id",
    ).references(() => collegeMemberships.id, {
      onDelete: "restrict",
    }),
    actorRole: varchar("actor_role", {
      length: 32,
    }),
    action: varchar("action", {
      length: 32,
    }).notNull(),
    previousStatus: varchar("previous_status", {
      length: 24,
    }),
    newStatus: varchar("new_status", {
      length: 24,
    }).notNull(),
    previousResultsPublished:
      boolean("previous_results_published"),
    newResultsPublished:
      boolean("new_results_published").notNull(),
    lifecycleVersionBefore: integer(
      "lifecycle_version_before",
    ),
    lifecycleVersionAfter: integer(
      "lifecycle_version_after",
    ).notNull(),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "course_quiz_lifecycle_events_quiz_version_uq",
    ).on(
      table.quizId,
      table.lifecycleVersionAfter,
    ),
    index(
      "course_quiz_lifecycle_events_quiz_time_idx",
    ).on(table.quizId, table.occurredAt),
    index(
      "course_quiz_lifecycle_events_college_time_idx",
    ).on(table.collegeId, table.occurredAt),
    index(
      "course_quiz_lifecycle_events_actor_time_idx",
    ).on(table.actorUserId, table.occurredAt),
    check(
      "course_quiz_lifecycle_events_action_ck",
      sql`${table.action} in (
        'BASELINE','CREATE','PUBLISH','UNPUBLISH','CLOSE','ARCHIVE',
        'RESULTS_PUBLISH','RESULTS_UNPUBLISH'
      )`,
    ),
    check(
      "course_quiz_lifecycle_events_status_ck",
      sql`${table.newStatus} in ('DRAFT','PUBLISHED','CLOSED','ARCHIVED')
        and (
          ${table.previousStatus} is null
          or ${table.previousStatus} in ('DRAFT','PUBLISHED','CLOSED','ARCHIVED')
        )`,
    ),
    check(
      "course_quiz_lifecycle_events_version_ck",
      sql`(
        ${table.action} in ('BASELINE','CREATE')
        and ${table.lifecycleVersionBefore} is null
        and ${table.lifecycleVersionAfter} = 0
      ) or (
        ${table.action} not in ('BASELINE','CREATE')
        and ${table.lifecycleVersionBefore} is not null
        and ${table.lifecycleVersionAfter} = ${table.lifecycleVersionBefore} + 1
      )`,
    ),
    check(
      "course_quiz_lifecycle_events_actor_ck",
      sql`(
        ${table.action} = 'BASELINE'
        and ${table.actorUserId} is null
        and ${table.actorMembershipId} is null
        and ${table.actorRole} is null
      ) or (
        ${table.action} <> 'BASELINE'
        and ${table.actorUserId} is not null
        and ${table.actorRole} in ('SUPER_ADMIN','COLLEGE_ADMIN','FACULTY')
      )`,
    ),
  ],
);

// Legacy prod has an active QUIZ_UNPUBLISH endpoint (PUBLISHED -> DRAFT).
// Current vNext does not expose UNPUBLISH yet, so the staged persistence
// taxonomy preserves it for parity while producer/API cutover remains an API
// phase requirement.
//
// Promotion prerequisite on course_quizzes:
//   lifecycle_version integer NOT NULL DEFAULT 0 CHECK (lifecycle_version >= 0)
//
// SQL candidate additionally owns:
// - state-machine validation;
// - same-college/role/delivery actor scope;
// - deferred same-transaction event completeness;
// - append-only event table and quiz hard-delete protection;
// - honest BASELINE backfill for pre-existing rows.
