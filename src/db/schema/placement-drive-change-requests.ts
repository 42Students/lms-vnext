import {sql} from "drizzle-orm";
import {bigint,check,index,pgTable,text,timestamp,uniqueIndex,uuid,varchar,integer} from "drizzle-orm/pg-core";
import {placementJobs} from "./placements";
import {users} from "./users";

/** Registered 0114: college ↔ company changes and discussion, never implicit drive mutation. */
export const placementDriveChangeRequests=pgTable("placement_drive_change_requests",{
 id:uuid("id").defaultRandom().primaryKey(),
 jobId:uuid("job_id").notNull().references(()=>placementJobs.id),
 createdByUserId:uuid("created_by_user_id").notNull().references(()=>users.id),
 proposerParty:varchar("proposer_party",{length:12}).notNull(),
 targetParty:varchar("target_party",{length:12}).notNull(),
 mode:varchar("mode",{length:12}).notNull(),
 field:varchar("field",{length:32}).notNull(),
 /** Before/after and source creator snapshots preserve the historic discussion. */
 currentValue:text("current_value"),
 proposedValue:text("proposed_value").notNull(),
 answerValue:text("answer_value"),
 replyText:text("reply_text"),
 creatorNameSnapshot:text("creator_name_snapshot"),
 creatorTypeSnapshot:varchar("creator_type_snapshot",{length:20}),
 legacyRequestId:bigint("legacy_request_id",{mode:"bigint"}),
 legacyCollegeId:integer("legacy_college_id"),
 legacyField:varchar("legacy_field",{length:32}),
 legacyKind:varchar("legacy_kind",{length:16}),
 legacyDirection:varchar("legacy_direction",{length:20}),
 reason:text("reason").notNull(),
 status:varchar("status",{length:16}).notNull().default("OPEN"),
 decisionNote:text("decision_note"),
 decidedByUserId:uuid("decided_by_user_id").references(()=>users.id),
 decidedAt:timestamp("decided_at",{withTimezone:true}),
 resolvedAt:timestamp("resolved_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("placement_drive_changes_job_status_idx").on(t.jobId,t.status,t.createdAt),
 index("placement_drive_changes_target_open_idx").on(t.jobId,t.targetParty,t.status,t.field),
 uniqueIndex("placement_drive_changes_one_open_field_uq")
   .on(t.jobId,t.field,t.proposerParty,t.targetParty).where(sql`${t.status} = 'OPEN' and ${t.field} <> 'OTHER'`),
 check("placement_drive_changes_parties_ck",sql`${t.proposerParty} in ('TPO','COMPANY') and ${t.targetParty} in ('TPO','COMPANY') and ${t.proposerParty} <> ${t.targetParty}`),
 check("placement_drive_changes_mode_ck",sql`${t.mode} in ('SUGGEST','ASK')`),
 check("placement_drive_changes_field_ck",sql`${t.field} in ('DEADLINE','PAY','ELIGIBILITY','LOCATION','ROUNDS','OTHER')`),
 check("placement_drive_changes_status_ck",sql`${t.status} in ('OPEN','ACCEPTED','ANSWERED','DECLINED','WITHDRAWN')`),
 check("placement_drive_changes_content_ck",sql`length(trim(${t.proposedValue}))>=2 and length(trim(${t.reason}))>=3`),
 check("placement_drive_changes_decision_ck",sql`(${t.status}='OPEN' and ${t.decidedAt} is null and ${t.decidedByUserId} is null) or (${t.status}<>'OPEN' and ${t.decidedAt} is not null and ${t.decidedByUserId} is not null)`),
]);
export const placementDriveChangeRequestMessages=pgTable("placement_drive_change_request_messages",{
 id:uuid("id").defaultRandom().primaryKey(),
 requestId:uuid("request_id").notNull().references(()=>placementDriveChangeRequests.id),
 senderUserId:uuid("sender_user_id").notNull().references(()=>users.id),
 senderParty:varchar("sender_party",{length:12}).notNull(),
 body:text("body").notNull(),
 sentAt:timestamp("sent_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("placement_drive_change_messages_request_idx").on(t.requestId,t.sentAt),
 check("placement_drive_change_messages_party_ck",sql`${t.senderParty} in ('TPO','COMPANY')`),
 check("placement_drive_change_messages_body_ck",sql`length(trim(${t.body})) between 1 and 2000`),
]);
