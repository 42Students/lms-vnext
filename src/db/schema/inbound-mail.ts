import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { users } from "./users";
import { collegeMemberships } from "./memberships";

/** Inbound mail triage. No webhook ingestion is enabled by this table alone. */
export const inboundMailMessages = pgTable(
  "inbound_mail_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceMessageId: varchar("source_message_id", { length: 255 }).notNull(),
    collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "restrict" }),
    fromAddress: varchar("from_address", { length: 320 }).notNull(),
    toAddress: varchar("to_address", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 512 }).notNull(),
    bodyPlain: text("body_plain").notNull(),
    /** Full authenticated inbound body: keep even when routing/stripping fails. */
    originalBodyPlain: text("original_body_plain"),
    bodyPreview: varchar("body_preview", { length: 1000 }),
    threadId: uuid("thread_id"),
    postedMessageId: uuid("posted_message_id"),
    recruiterUserId: uuid("recruiter_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    learnerMembershipId: uuid("learner_membership_id").references(
      () => collegeMemberships.id, { onDelete: "restrict" },
    ),
    /** REPLY is eligible for conversation routing; OTHER needs human triage. */
    kind: varchar("kind", { length: 16 }).notNull().default("OTHER"),
    /** Independent of triage status NEW/TRIAGED/RESOLVED. */
    routingStatus: varchar("routing_status", { length: 24 }).notNull().default("STORED"),
    routeAttemptCount: integer("route_attempt_count").notNull().default(0),
    lastRouteAttemptAt: timestamp("last_route_attempt_at", { withTimezone: true }),
    nextRouteAttemptAt: timestamp("next_route_attempt_at", { withTimezone: true }),
    lastRouteErrorCode: varchar("last_route_error_code", { length: 64 }),
    handledAt: timestamp("handled_at", { withTimezone: true }),
    handledByUserId: uuid("handled_by_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    status: varchar("status", { length: 16 }).notNull().default("NEW"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    version: integer("version").notNull().default(0),
  },
  (t) => [
    uniqueIndex("inbound_mail_source_key").on(t.sourceMessageId),
    index("inbound_mail_received_at").on(t.receivedAt),
    index("inbound_mail_college_status").on(t.collegeId, t.status),
    index("inbound_mail_kind_route_received_idx").on(t.kind, t.routingStatus, t.receivedAt),
    index("inbound_mail_thread_id_idx").on(t.threadId),
    index("inbound_mail_handled_at_idx").on(t.handledAt),
    index("inbound_mail_retry_due_idx").on(t.nextRouteAttemptAt)
      .where(sql`${t.routingStatus} in ('FAILED', 'NO_THREAD', 'ACCESS_ENDED')`),
    check("inbound_mail_kind_ck", sql`${t.kind} in ('REPLY', 'OTHER')`),
    check(
      "inbound_mail_routing_status_ck",
      sql`${t.routingStatus} in ('POSTED', 'STORED', 'NO_THREAD', 'WRONG_SENDER', 'NOT_VERIFIED', 'EMPTY', 'ACCESS_ENDED', 'FAILED')`,
    ),
    check("inbound_mail_route_attempt_count_ck", sql`${t.routeAttemptCount} >= 0`),
    check(
      "inbound_mail_handled_pair_ck",
      sql`(${t.handledAt} is null) = (${t.handledByUserId} is null)`,
    ),
    check(
      "inbound_mail_body_bounds_ck",
      sql`length(${t.bodyPlain}) <= 200000 and (${t.originalBodyPlain} is null or length(${t.originalBodyPlain}) <= 200000)`,
    ),
    check("inbound_mail_messages_status_ck", sql`${t.status} in ('NEW', 'TRIAGED', 'RESOLVED')`),
    check("inbound_mail_messages_version_ck", sql`${t.version} >= 0`),
  ],
);

/** Shared mailbox intake classification. Worker proofs must be checked before
 * calling this: a public sender's From header is never authentication. */
export const VERIFIED_INBOUND_ROUTING_OUTCOMES=[
 "POSTED","STORED","NO_THREAD","WRONG_SENDER",
 "NOT_VERIFIED","EMPTY","ACCESS_ENDED","FAILED",
] as const;
export function inboundMailRecipientKind(address:string,replyDomain:string){
 const parsed=/^r-[a-f0-9]{32}@([a-z0-9.-]+)$/i.exec(address.trim());
 return parsed&&replyDomain.length>0&&parsed[1]?.toLowerCase()===replyDomain.toLowerCase()
  ?"REPLY" as const:"OTHER" as const;
}
