/**
 * Internal-only TPO team conversations. Recruiter grants must never authorize
 * these tables. Participants and authors are bound to the thread's college via
 * composite foreign keys; authors must be thread participants (SQL trigger).
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
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
    topic: varchar("topic", { length: 200 }).notNull(),
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

/** The Everybody/Everyone channel is implicit for every active TPO membership. */
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

/** The permanent Everyone channel has no invite roster: membership is derived
 * from active college TPO roles on every read and write. */
export const placementTpoTeamEveryoneMessages=pgTable(
 "placement_tpo_team_everyone_messages",
 {
  id:uuid("id").defaultRandom().primaryKey(),
  collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
  authorMembershipId:uuid("author_membership_id").notNull(),
  body:text("body").notNull(),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 },
 t=>[
  index("tpo_team_everyone_messages_college_time_idx").on(t.collegeId,t.createdAt),
  foreignKey({
   name:"tpo_team_everyone_messages_author_college_fk",
   columns:[t.authorMembershipId,t.collegeId],
   foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId],
  }).onDelete("restrict"),
  check("tpo_team_everyone_message_body_ck",sql`length(btrim(${t.body})) between 1 and 4000`),
 ],
);

/** Muting suppresses unread alerts but never revokes access to Everyone. */
export const placementTpoTeamEveryoneMutes=pgTable(
 "placement_tpo_team_everyone_mutes",
 {
  collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
  membershipId:uuid("membership_id").notNull(),
  mutedAt:timestamp("muted_at",{withTimezone:true}).notNull().defaultNow(),
 },
 t=>[
  primaryKey({name:"tpo_team_everyone_mutes_pk",columns:[t.collegeId,t.membershipId]}),
  foreignKey({
   name:"tpo_team_everyone_mutes_member_college_fk",
   columns:[t.membershipId,t.collegeId],
   foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId],
  }).onDelete("restrict"),
 ],
);

/** TPO-inbox-team-R05: bell delivery acknowledgements are independent of
 * member-specific conversation read positions. */
export const placementTpoInternalReads=pgTable(
 "placement_tpo_internal_reads",
 {
  collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
  threadId:uuid("thread_id").notNull(),
  membershipId:uuid("membership_id").notNull(),
  readThrough:timestamp("read_through",{withTimezone:true}).notNull(),
  following:boolean("following").notNull().default(true),
  mutedAt:timestamp("muted_at",{withTimezone:true}),
 },
 t=>[
  primaryKey({name:"tpo_internal_reads_pk",columns:[t.threadId,t.membershipId]}),
  foreignKey({
   name:"tpo_internal_reads_thread_college_fk",
   columns:[t.threadId,t.collegeId],
   foreignColumns:[placementTpoInternalThreads.id,placementTpoInternalThreads.collegeId],
  }).onDelete("restrict"),
  foreignKey({
   name:"tpo_internal_reads_member_college_fk",
   columns:[t.membershipId,t.collegeId],
   foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId],
  }).onDelete("restrict"),
  index("tpo_internal_reads_member_idx").on(t.collegeId,t.membershipId),
 ],
);

/** TPO-inbox-team-34: explicitly declared temporary absence, scoped to one membership. */
export const placementTpoTeamAway=pgTable("placement_tpo_team_away",{
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 membershipId:uuid("membership_id").notNull(),
 awayUntil:timestamp("away_until",{withTimezone:true}).notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 primaryKey({name:"tpo_team_away_pk",columns:[t.collegeId,t.membershipId]}),
 foreignKey({name:"tpo_team_away_membership_college_fk",columns:[t.membershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("restrict"),
 index("tpo_team_away_until_idx").on(t.collegeId,t.awayUntil),
]);

/** TPO-inbox-team-22: one member may ask another participant, with lifecycle audit. */
export const placementTpoTeamAsks=pgTable("placement_tpo_team_asks",{
 id:uuid("id").defaultRandom().primaryKey(),
 threadId:uuid("thread_id").notNull(),
 collegeId:uuid("college_id").notNull(),
 askerMembershipId:uuid("asker_membership_id").notNull(),
 assigneeMembershipId:uuid("assignee_membership_id").notNull(),
 requestKey:uuid("request_key").notNull(),
 title:varchar("title",{length:200}).notNull(),
 dueAt:timestamp("due_at",{withTimezone:true}),
 status:varchar("status",{length:12}).notNull().default("OPEN"),
 doneNote:text("done_note"),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 foreignKey({name:"tpo_team_asks_thread_college_fk",columns:[t.threadId,t.collegeId],
  foreignColumns:[placementTpoInternalThreads.id,placementTpoInternalThreads.collegeId]}).onDelete("restrict"),
 foreignKey({name:"tpo_team_asks_asker_college_fk",columns:[t.askerMembershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("restrict"),
 foreignKey({name:"tpo_team_asks_assignee_college_fk",columns:[t.assigneeMembershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("restrict"),
 uniqueIndex("tpo_team_asks_dedupe_uq").on(t.threadId,t.askerMembershipId,t.requestKey),
 index("tpo_team_asks_assignee_due_idx").on(t.collegeId,t.assigneeMembershipId,t.status,t.dueAt),
 check("tpo_team_asks_distinct_people_ck",sql`${t.askerMembershipId} <> ${t.assigneeMembershipId}`),
 check("tpo_team_asks_status_ck",sql`${t.status} in ('OPEN','DONE','CANCELLED')`),
 check("tpo_team_asks_title_ck",sql`length(btrim(${t.title})) between 1 and 200`),
 check("tpo_team_asks_note_ck",sql`${t.doneNote} is null or length(${t.doneNote}) <= 2000`),
]);
