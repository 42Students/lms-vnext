/**
 * TPO-inbox-team-43: frozen recipients of targeted TPO notices (scoped to one
 * college by trigger). Legacy numeric studentId identifies a learner account;
 * vNext membershipId identifies that learner's membership in this college.
 * Never map numeric studentId directly to a users.id or use a cross-college
 * membership. Direct receipts are separate from user notification read state;
 * mark-read must use the authenticated learner membership and resolved TPO
 * announcement audience, never mark every membership for the same user read.
 * A historic read flag cannot be inferred without receipt timestamp evidence.
 */
import { pgTable, primaryKey, uuid, varchar, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { db10Announcements } from "./db10-announcements";
import { collegeMemberships } from "./memberships";

export const placementTpoNoticeAudiences = pgTable(
  "placement_tpo_notice_audiences",
  {
    announcementId: uuid("announcement_id")
      .primaryKey()
      .references(() => db10Announcements.id, { onDelete: "restrict" }),
    kind: varchar("kind", { length: 24 }).notNull(),
  },
  (t) => [
    check(
      "tpo_notice_audience_kind_ck",
      sql`${t.kind} IN ('COLLEGE','PLACEMENTS','BATCHES','BRANCHES','DRIVE')`,
    ),
  ],
);

export const placementTpoNoticeRecipients = pgTable(
  "placement_tpo_notice_recipients",
  {
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => db10Announcements.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.announcementId, t.membershipId] })],
);

/** The old audience stored numeric batch/job IDs and free-text branches.
 * Resolve every source key with a verified same-college mapping before
 * snapshotting individual membership recipients. Historic read states must
 * be sourced from a real receipt timestamp, never inferred from selection. */
export function legacyTpoNoticeAudienceCrosswalk(input:{
 sourceKind:"COLLEGE"|"PLACEMENTS"|"BATCHES"|"BRANCHES"|"DRIVE";
 sourceBatchIds:readonly number[];sourceBranchNames:readonly string[];
 sourceJobId:number|null;
 resolvedCohorts:readonly {legacyId:number;id:string;collegeId:string}[];
 resolvedDepartments:readonly {legacyName:string;id:string;collegeId:string}[];
 resolvedJob:{legacyId:number;id:string;collegeId:string}|null;
 collegeId:string;
 recipients:readonly {membershipId:string;collegeId:string;readAt:string|null}[];
}){
 const valid=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
 if(!valid(input.collegeId))throw new Error("Unverified notice college");
 const cohorts=input.sourceBatchIds.map(id=>{
  const hit=input.resolvedCohorts.find(row=>row.legacyId===id&&row.collegeId===input.collegeId);
  if(!hit||!valid(hit.id))throw new Error("Unmapped legacy batch audience");
  return hit.id;
 });
 const departments=input.sourceBranchNames.map(name=>{
  const hit=input.resolvedDepartments.find(row=>row.collegeId===input.collegeId&&
    row.legacyName.toLocaleLowerCase("en-IN")===name.trim().toLocaleLowerCase("en-IN"));
  if(!hit||!valid(hit.id))throw new Error("Unmapped branch audience");
  return hit.id;
 });
 const job=input.sourceJobId===null?null:input.resolvedJob;
 if(input.sourceJobId!==null&&(!job||job.legacyId!==input.sourceJobId||
     job.collegeId!==input.collegeId||!valid(job.id)))
  throw new Error("Unmapped legacy drive audience");
 const recipients=new Map<string,{membershipId:string;readAt:string|null}>();
 for(const recipient of input.recipients){
  if(recipient.collegeId!==input.collegeId||!valid(recipient.membershipId))
   throw new Error("Cross-college notice recipient");
  const existing=recipients.get(recipient.membershipId);
  if(existing&&existing.readAt!==recipient.readAt)
   throw new Error("Conflicting historic read receipt");
  recipients.set(recipient.membershipId,{
    membershipId:recipient.membershipId,readAt:recipient.readAt});
 }
 return {kind:input.sourceKind,collegeId:input.collegeId,
  cohortIds:[...new Set(cohorts)],departmentIds:[...new Set(departments)],
  jobId:job?.id??null,recipients:[...recipients.values()]};
}
/** A historic ACTIVE or APPLIED stage filters the frozen import snapshot only.
 * New enrollments must not retroactively receive an already-issued notice. */
export const LEGACY_TPO_NOTICE_STAGE_FILTERS=["APPLIED","ACTIVE"] as const;
