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

/** Inbound mail triage. No webhook ingestion is enabled by this table alone. */
export const inboundMailMessages = pgTable(
  "inbound_mail_messages",
  {
    id: uuid("id").primaryKey(),
    sourceMessageId: varchar("source_message_id", { length: 255 }).notNull(),
    collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "restrict" }),
    fromAddress: varchar("from_address", { length: 320 }).notNull(),
    toAddress: varchar("to_address", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 512 }).notNull(),
    bodyPlain: text("body_plain").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("NEW"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    version: integer("version").notNull().default(0),
  },
  (t) => [
    uniqueIndex("inbound_mail_source_key").on(t.sourceMessageId),
    index("inbound_mail_received_at").on(t.receivedAt),
    index("inbound_mail_college_status").on(t.collegeId, t.status),
    check("inbound_mail_messages_status_ck", sql`${t.status} in ('NEW', 'TRIAGED', 'RESOLVED')`),
    check("inbound_mail_messages_version_ck", sql`${t.version} >= 0`),
  ],
);
