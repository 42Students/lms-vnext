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
  // Native Date parsing may silently turn 30 February into March. Check
  // the source wall-clock date before applying its explicit zone offset.
  const [datePart,timePart]=value.split("T");
  const [year,month,day]=datePart.split("-").map(Number);
  const [hour,minute]=timePart.slice(0,5).split(":").map(Number);
  const second=timePart[5]===":"?Number(timePart.slice(6,8)):0;
  const wall=new Date(Date.UTC(year,month-1,day,hour,minute,second));
  const offset=/([+-])(\d{2}):(\d{2})$/.exec(value);
  if(year<100||wall.getUTCFullYear()!==year||
     wall.getUTCMonth()+1!==month||wall.getUTCDate()!==day||
     wall.getUTCHours()!==hour||wall.getUTCMinutes()!==minute||
     wall.getUTCSeconds()!==second||
     (offset&&(Number(offset[2])>23||Number(offset[3])>59)))
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

/**
 * Atomic acceptance plan for an unambiguous recruiter change suggestion.
 * Caller MUST first authorize a live TPO/college member, lock the same job
 * and request, and record the audit event in the surrounding transaction.
 * One statement changes the job version and only then records ACCEPTED.
 * A zero-row result is a stale, revoked, wrong-college or invalid decision.
 */
export function atomicSafeDriveChangeAcceptanceStatement(input: {
  requestId: string;
  jobId: string;
  collegeId: string;
  actorUserId: string;
  expectedJobVersion: number;
  at: Date;
  patch: SafeDriveChangeJobPatch;
}) {
  const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  if (![input.requestId,input.jobId,input.collegeId,input.actorUserId]
       .every(value => uuidPattern.test(value)) ||
      !Number.isSafeInteger(input.expectedJobVersion) || input.expectedJobVersion < 1 ||
      !Number.isFinite(input.at.getTime()))
    throw new Error("Invalid scoped job change request");
  const updateField = input.patch.field === "DEADLINE"
    ? sql`application_deadline = ${input.patch.changes.applicationDeadline},`
    : sql`locations = ${input.patch.changes.locations}::text[],`;
  return sql`
    WITH eligible AS MATERIALIZED (
      SELECT r.id FROM placement_drive_change_requests r
        JOIN placement_jobs j ON j.id = r.job_id
       WHERE r.id = ${input.requestId}::uuid
         AND r.job_id = ${input.jobId}::uuid
         AND j.college_id = ${input.collegeId}::uuid
         AND j.version = ${input.expectedJobVersion}
         AND j.status NOT IN ('ARCHIVED','CANCELLED')
         AND r.status = 'OPEN' AND r.mode = 'SUGGEST'
         AND r.field = ${input.patch.field}
         AND r.applied_at IS NULL
       FOR UPDATE OF j, r
    ), patched_job AS (
      UPDATE placement_jobs j
         SET ${updateField}
             version = j.version + 1, updated_at = ${input.at}
       WHERE j.id = ${input.jobId}::uuid
         AND j.college_id = ${input.collegeId}::uuid
         AND j.version = ${input.expectedJobVersion}
         AND EXISTS (SELECT 1 FROM eligible)
      RETURNING j.id, j.version
    ), accepted AS (
      UPDATE placement_drive_change_requests r
         SET status = 'ACCEPTED',
             applied_at = ${input.at},
             applied_by_user_id = ${input.actorUserId}::uuid,
             applied_job_version = j.version,
             decided_at = ${input.at},
             decided_by_user_id = ${input.actorUserId}::uuid,
             resolved_at = ${input.at},
             updated_at = ${input.at}
        FROM patched_job j
       WHERE r.id = ${input.requestId}::uuid
         AND r.job_id = j.id AND r.status = 'OPEN'
      RETURNING r.id, r.job_id, r.applied_job_version
    )
    SELECT * FROM accepted
  `;
}
