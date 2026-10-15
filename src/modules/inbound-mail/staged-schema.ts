import {pgTable,uuid,varchar,text,timestamp,integer,index,uniqueIndex} from "drizzle-orm/pg-core";
/** Proposed only; NOT imported into src/db/schema or registered migrations. */
export const inboundMailMessagesStaged=pgTable("inbound_mail_messages",{
 id:uuid("id").primaryKey(),
 sourceMessageId:varchar("source_message_id",{length:255}).notNull(),
 collegeId:uuid("college_id"),
 fromAddress:varchar("from_address",{length:320}).notNull(),
 toAddress:varchar("to_address",{length:320}).notNull(),
 subject:varchar("subject",{length:512}).notNull(),
 bodyPlain:text("body_plain").notNull(),
 status:varchar("status",{length:16}).notNull(),
 receivedAt:timestamp("received_at",{withTimezone:true}).notNull(),
 version:integer("version").notNull().default(0),
},(table)=>[
 uniqueIndex("inbound_mail_source_key").on(table.sourceMessageId),
 index("inbound_mail_received_at").on(table.receivedAt),
 index("inbound_mail_college_status").on(table.collegeId,table.status),
]);
