/**
 * Internal-only TPO team conversations. Recruiter grants must never authorize
 * these tables. Participants and authors are bound to the thread's college via
 * composite foreign keys; authors must be thread participants (SQL trigger).
 */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";

export const placementTpoInternalThreads = pgTable(
  "placement_tpo_internal_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    startedByMembershipId: uuid("started_by_membership_id").notNull(),
    invitedMembershipId: uuid("invited_membership_id").notNull(),
    topic: varchar("topic", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("placement_tpo_internal_threads_id_college_uq").on(t.id, t.collegeId),
    index("tpo_internal_threads_college_idx").on(t.collegeId, t.createdAt),
    foreignKey({
      name: "placement_tpo_internal_threads_started_by_college_fk",
      columns: [t.startedByMembershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    foreignKey({
      name: "placement_tpo_internal_threads_invited_college_fk",
      columns: [t.invitedMembershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    check("placement_tpo_internal_threads_topic_ck", sql`length(btrim(${t.topic})) > 0`),
    check(
      "placement_tpo_internal_threads_distinct_ck",
      sql`${t.startedByMembershipId} <> ${t.invitedMembershipId}`,
    ),
  ],
);

export const placementTpoInternalMessages = pgTable(
  "placement_tpo_internal_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id").notNull(),
    collegeId: uuid("college_id").notNull(),
    authorMembershipId: uuid("author_membership_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tpo_internal_messages_thread_idx").on(t.threadId, t.createdAt),
    foreignKey({
      name: "placement_tpo_internal_messages_thread_college_fk",
      columns: [t.threadId, t.collegeId],
      foreignColumns: [placementTpoInternalThreads.id, placementTpoInternalThreads.collegeId],
    }).onDelete("restrict"),
    foreignKey({
      name: "placement_tpo_internal_messages_author_college_fk",
      columns: [t.authorMembershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    check(
      "placement_tpo_internal_messages_body_ck",
      sql`length(btrim(${t.body})) between 1 and 4000`,
    ),
  ],
);
