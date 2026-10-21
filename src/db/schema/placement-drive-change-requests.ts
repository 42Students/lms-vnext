import {sql} from "drizzle-orm";
import {bigint,boolean,check,index,pgTable,text,timestamp,uniqueIndex,uuid,varchar,integer} from "drizzle-orm/pg-core";
import {placementJobs} from "./placements";
import {users} from "./users";

/** Registered 0114: company changes and discussion. ACCEPT is a decision;
 * only a verified, scoped job-patch transaction may mark a suggestion applied. */
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
 // External relationship discussion remains readable after request closure.
 canonicalThreadId:uuid("canonical_thread_id"),
 legacyWasReplied:boolean("legacy_was_replied"),
 reason:text("reason").notNull(),
 status:varchar("status",{length:16}).notNull().default("OPEN"),
 decisionNote:text("decision_note"),
 decidedByUserId:uuid("decided_by_user_id").references(()=>users.id),
 decidedAt:timestamp("decided_at",{withTimezone:true}),
 resolvedAt:timestamp("resolved_at",{withTimezone:true}),
 /** Atomic accepted-suggestion application receipt; null means not applied. */
 appliedAt:timestamp("applied_at",{withTimezone:true}),
 appliedByUserId:uuid("applied_by_user_id").references(()=>users.id),
 appliedJobVersion:integer("applied_job_version"),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("placement_drive_changes_job_status_idx").on(t.jobId,t.status,t.createdAt),
 index("placement_drive_changes_target_open_idx").on(t.jobId,t.targetParty,t.status,t.field),
 index("placement_drive_changes_thread_idx").on(t.canonicalThreadId),
 uniqueIndex("placement_drive_changes_one_open_field_uq")
   .on(t.jobId,t.field,t.proposerParty,t.targetParty).where(sql`${t.status} = 'OPEN' and ${t.field} <> 'OTHER'`),
 check("placement_drive_changes_parties_ck",sql`${t.proposerParty} in ('TPO','COMPANY') and ${t.targetParty} in ('TPO','COMPANY') and ${t.proposerParty} <> ${t.targetParty}`),
 check("placement_drive_changes_mode_ck",sql`${t.mode} in ('SUGGEST','ASK')`),
 check("placement_drive_changes_field_ck",sql`${t.field} in ('DEADLINE','PAY','ELIGIBILITY','LOCATION','ROUNDS','OTHER')`),
 check("placement_drive_changes_status_ck",sql`${t.status} in ('OPEN','ACCEPTED','ANSWERED','DECLINED','WITHDRAWN')`),
 check("placement_drive_changes_content_ck",sql`length(trim(${t.proposedValue}))>=2 and length(trim(${t.reason}))>=3`),
 check("placement_drive_changes_applied_ck",sql`(${t.appliedAt} is null and ${t.appliedByUserId} is null and ${t.appliedJobVersion} is null) or (${t.status} = 'ACCEPTED' and ${t.mode} = 'SUGGEST' and ${t.appliedAt} is not null and ${t.appliedByUserId} is not null and ${t.appliedJobVersion} > 0)`),
 // Once 0305 is promoted, ACCEPTED is only possible after an in-transaction
 // job write plus a receipt, never a standalone request-status transition.
 check("placement_drive_changes_accepted_receipt_ck",
  sql`${t.status} <> 'ACCEPTED' or (${t.appliedAt} is not null and ${t.appliedByUserId} is not null and ${t.appliedJobVersion} is not null)`),
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

/** Source REPLIED is a final declined decision, not a live OPEN request. */
export function normalizeLegacyDriveChangeStatus(raw:string):
  "OPEN"|"ACCEPTED"|"ANSWERED"|"DECLINED"|"WITHDRAWN"|null {
 const key=raw.trim().toUpperCase();
 if(key==="REPLIED")return "DECLINED";
 return key==="OPEN"||key==="ACCEPTED"||key==="ANSWERED"||key==="DECLINED"||key==="WITHDRAWN"?key:null;
}

/** Normalize only unambiguous job-wide changes. Other legacy fields such as
 * ROLE_TITLE, CTC, MIN_CGPA, and BRANCHES require their specific role/policy
 * writers; silently accepting their request without changing those rows is
 * forbidden. The service must lock the college-owned job, perform this patch,
 * CAS-increment job.version and write the applied receipt atomically.
 */
export type SafeDriveChangeJobPatch =
 | {field:"DEADLINE"; changes:{applicationDeadline:Date}}
 | {field:"LOCATION"; changes:{locations:string[]}};

export function prepareSafeDriveChangeJobPatch(
 input:{mode:string;field:string;legacyField:string|null;proposedValue:string},
 now:Date=new Date(),
):SafeDriveChangeJobPatch|null {
 if(input.mode!=="SUGGEST"||!Number.isFinite(now.getTime()))return null;
 const field=input.legacyField??input.field;
 const value=input.proposedValue.trim();
 if(field==="DEADLINE"){
  // Date-only and timezone-free timestamps are ambiguous around IST. A
  // recruiter must supply an explicit instant, never a local parsed guess.
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))
   return null;
  const proposed=new Date(value);
  if(!Number.isFinite(proposed.getTime())||proposed.getTime()<=now.getTime())
   return null;
  return {field:"DEADLINE",changes:{applicationDeadline:proposed}};
 }
 if(field==="LOCATION"){
  const values=value.split(",").map(part=>part.trim());
  if(values.length<1||values.length>25||
     values.some(location=>location.length<1||location.length>255))
   return null;
  if(new Set(values.map(location=>location.toLocaleLowerCase("en-IN"))).size!==values.length)
   return null;
  return {field:"LOCATION",changes:{locations:values}};
 }
 return null;
}
