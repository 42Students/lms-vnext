import {sql} from "drizzle-orm";
import {check,index,pgTable,timestamp,uniqueIndex,uuid,varchar} from "drizzle-orm/pg-core";
import {placementTpoMessages,placementTpoMessageThreads} from "./tpo-collaboration";
import {users} from "./users";

/**
 * Recruiter email bridge storage is already registered by 0135_lanes_round_3.
 * Neither the dispatch worker nor inbound intake may activate without signed
 * provider credentials, verified inbound signature, trusted sender evidence,
 * reply-token expiry, registered table guard and explicit enablement.
 * Raw inbound message identifiers and email contents never enter these rows.
 * Legacy recruiter_emailed_at and raw reply token are deliberately retired.
 */
export const placementRecruiterMessageMailState=pgTable("placement_recruiter_message_mail_state",{
 threadId:uuid("thread_id").primaryKey().references(()=>placementTpoMessageThreads.id,{onDelete:"restrict"}),
 recruiterUserId:uuid("recruiter_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 lastSentAt:timestamp("last_sent_at",{withTimezone:true}),
 lastNotifiedMessageId:uuid("last_notified_message_id").references(()=>placementTpoMessages.id,{onDelete:"restrict"}),
 replyTokenHash:varchar("reply_token_hash",{length:64}),
 replyTokenExpiresAt:timestamp("reply_token_expires_at",{withTimezone:true}),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("recruiter_message_mail_owner_idx").on(t.recruiterUserId),
 uniqueIndex("recruiter_message_mail_token_uq").on(t.replyTokenHash)
   .where(sql`${t.replyTokenHash} is not null`),
 check("recruiter_message_mail_token_pair_ck",sql`(${t.replyTokenHash} is null and ${t.replyTokenExpiresAt} is null)
 or (${t.replyTokenHash} ~ '^[a-f0-9]{64}$' and ${t.replyTokenExpiresAt} is not null)`),
]);

/** Hash only external message ids: raw sender and email body stay in official thread. */
export const placementRecruiterInboundEmailEvents=pgTable("placement_recruiter_inbound_email_events",{
 id:uuid("id").defaultRandom().primaryKey(),
 messageIdHash:varchar("message_id_hash",{length:64}).notNull().unique(),
 threadId:uuid("thread_id").notNull().references(()=>placementTpoMessageThreads.id,{onDelete:"restrict"}),
 messageId:uuid("message_id").notNull().references(()=>placementTpoMessages.id,{onDelete:"restrict"}),
 receivedAt:timestamp("received_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("recruiter_inbound_email_thread_idx").on(t.threadId,t.receivedAt),
 check("recruiter_inbound_email_hash_ck",sql`${t.messageIdHash} ~ '^[a-f0-9]{64}$'`),
]);
