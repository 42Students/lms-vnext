import "server-only";
import { and, asc, desc, eq, gte, lte, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, users, learnerProfiles, learnerProgramEnrollments, cohorts, programs, departments } from "@/db/schema";
import { profileVerifications, profileVerificationSettings, profileVerificationTpoGrants, profileVerificationEvents } from "@/db/schema/profile-verification";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { loadPlacementCollegeScope } from "./scope";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";
import {effectiveTpoVerifierSetting,tpoVerifierGrantAllowed} from "@/modules/verification/switch-state";
import { placementTableExists } from "./staged-tables";
import type { VerificationQueueCard } from "@/components/verification/VerificationWorkspace";
import {submittedMarksheets} from "@/modules/verification/queue-mark-sheets";
import {verificationDocumentManifest} from "@/modules/verification/document-manifest";
import {verificationAttentionFlags} from "@/modules/verification/attention-flags";
import {tpoVerificationStatuses,tpoVerificationWaitingDateRange,type TpoVerificationQuery} from "@/modules/verification/tpo-queue-server-model";
const statusSchema=z.enum(["SUBMITTED","UPDATE_PENDING","VERIFIED","SENT_BACK"]);
const sectionSchema=z.enum(["EDUCATION","IDENTITY"]);
export async function getTpoVerificationQueue(ctx:RequestContext,query?:TpoVerificationQuery,memberIds?:readonly string[]):Promise<{
 available:boolean;enabled:boolean;permitted:boolean;rows:VerificationQueueCard[];hasMore?:boolean;
 denialReason?:"STORAGE_UNAVAILABLE"|"DISABLED_BY_COLLEGE"|"DELEGATION_REQUIRED";
 counts?:{WAITING:number;SENT_BACK:number;VERIFIED:number};
 legacyCounts?:{SUBMITTED:number;UPDATE_PENDING:number;SENT_BACK:number;VERIFIED:number};
}>{
 const collegeId=await requireTpoBatchActor(ctx);
 if(memberIds&&memberIds.length>100)throw Error("VERIFICATION_SELECTION_TOO_LARGE");
 if(memberIds?.length===0)return {available:true,enabled:true,permitted:true,rows:[],hasMore:false};
 const names=["profile_verifications","profile_verification_settings","profile_verification_tpo_grants"];
 const available=(await Promise.all(names.map(placementTableExists))).every(Boolean);
 if(!available)return {available:false,enabled:false,permitted:false,rows:[],denialReason:"STORAGE_UNAVAILABLE"};
 const [setting]=await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
  .from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,collegeId)).limit(1);
 // Legacy default: enabled unless the college admin explicitly switches it off.
 if(!effectiveTpoVerifierSetting(setting))return {available:true,enabled:false,permitted:false,rows:[],denialReason:"DISABLED_BY_COLLEGE"};
 const [grant]=await getDb().select({revokedAt:profileVerificationTpoGrants.revokedAt})
  .from(profileVerificationTpoGrants)
  .where(eq(profileVerificationTpoGrants.membershipId,ctx.membership!.id)).limit(1);
 if(!tpoVerifierGrantAllowed(grant))return {available:true,enabled:true,permitted:false,rows:[],denialReason:"DELEGATION_REQUIRED"};
 const college=await loadPlacementCollegeScope(collegeId);
 requirePermission(ctx,"profile-verification.review",{
  collegeId,organizationId:college.organizationId,
  tpoVerificationAdministrator:true,tpoVerificationEnabled:true,
 });
 const dateRange=query&&query.tab==="WAITING"?tpoVerificationWaitingDateRange(query.waitingSince):{};
 const academicMembers=query&&(query.batchId||query.branchId)?getDb()
  .select({membershipId:learnerProgramEnrollments.membershipId})
  .from(learnerProgramEnrollments)
  .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
  .innerJoin(programs,and(eq(programs.id,learnerProgramEnrollments.programId),eq(programs.id,cohorts.programId)))
  .innerJoin(departments,eq(departments.id,programs.departmentId))
  .where(and(
   eq(departments.collegeId,collegeId),
   eq(learnerProgramEnrollments.status,"ACTIVE"),
   ...(query.batchId?[eq(cohorts.id,query.batchId)]:[]),
   ...(query.branchId?[eq(departments.id,query.branchId)]:[]),
  )):null;
 // Search remains database-side before pagination. Escape LIKE wildcard
 // characters so a learner roll search matches literal user input.
 const searchPattern=query?.search?"%"+query.search.replace(/[\\%_]/g,"\\ const records=await getDb().select({")+"%":null;
 const records=await getDb().select({
  id:profileVerifications.learnerMembershipId,status:profileVerifications.status,
  section:profileVerifications.section,submittedAt:profileVerifications.submittedAt,
  version:profileVerifications.rowVersion,name:users.displayName,
  decidedAt:profileVerifications.decidedAt,decidedByName:profileVerifications.decidedByName,
  submittedSnapshot:profileVerifications.submittedSnapshot,
  rollNumber:learnerProfiles.rollNumber,decisionNote:profileVerifications.note,
 }).from(profileVerifications)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,profileVerifications.learnerMembershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
   ...(query?[
    inArray(profileVerifications.status,tpoVerificationStatuses(query)),
    ...(dateRange.after?[gte(profileVerifications.submittedAt,dateRange.after)]:[]),
    ...(dateRange.before?[lte(profileVerifications.submittedAt,dateRange.before)]:[]),
    ...(query.kind!=="ALL"?[eq(profileVerifications.section,query.kind)]:[]),
    ...(searchPattern?[or(ilike(users.displayName,searchPattern),ilike(learnerProfiles.rollNumber,searchPattern))]:[]),
    ...(academicMembers?[inArray(profileVerifications.learnerMembershipId,academicMembers)]:[]),
   ]:[]),
   ...(memberIds?[inArray(profileVerifications.learnerMembershipId,[...memberIds])]:[]))))
  .orderBy(query?.tab==="WAITING"?asc(profileVerifications.submittedAt):desc(profileVerifications.submittedAt),desc(profileVerifications.id))
  .limit(query?query.pageSize+1:100).offset(query?(query.page-1)*query.pageSize:0);
 const selected=query?records.slice(0,query.pageSize):records;
 const selectedMemberIds=[...new Set(selected.map(row=>row.id))];
 const enrollments=selectedMemberIds.length?await getDb().select({
  membershipId:learnerProgramEnrollments.membershipId,
  batchName:cohorts.name,branchName:departments.name,
 }).from(learnerProgramEnrollments)
  .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
  .innerJoin(programs,and(eq(programs.id,learnerProgramEnrollments.programId),eq(programs.id,cohorts.programId)))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,collegeId)))
  .where(and(inArray(learnerProgramEnrollments.membershipId,selectedMemberIds),
   eq(learnerProgramEnrollments.status,"ACTIVE"))):[];
 const byMember=new Map(enrollments.map(row=>[row.membershipId,row]));
 const evaluatedAt=new Date();
 const rows:VerificationQueueCard[]=selected.flatMap(row=>{
  const status=statusSchema.safeParse(row.status),section=sectionSchema.safeParse(row.section);
  if(!status.success||!section.success)return [];
  const marks=submittedMarksheets(row.submittedSnapshot);
  const missingMarksheet=section.data==="EDUCATION"&&marks.missing>0;
  const missingIdentityProof=section.data==="IDENTITY"&&
    !verificationDocumentManifest(row.submittedSnapshot).some(ref=>ref.purpose==="AADHAAR"||ref.purpose==="PAN");
  const attention=verificationAttentionFlags({status:status.data,section:section.data,
    submittedAt:row.submittedAt,missingMarksheet},evaluatedAt)
    .map(flag=>flag.replaceAll("_"," ").toLowerCase());
  if(missingIdentityProof)attention.push("missing identity proof");
  // Do not silently offer blind verification for incomplete documents.
  if((missingMarksheet||missingIdentityProof)&&
    ["SUBMITTED","UPDATE_PENDING"].includes(status.data))attention.push("review documents before verification");
  return [{learnerMembershipId:row.id,learnerName:row.name?.trim()||"Unnamed learner",
   batchName:byMember.get(row.id)?.batchName??null,branchName:byMember.get(row.id)?.branchName??null,
   status:status.data,section:section.data,
   submittedAt:row.submittedAt,version:row.version,missingMarksheet,missingIdentityProof,
   decidedAt:row.decidedAt,decidedByName:row.decidedByName,
   rollNumber:row.rollNumber,decisionNote:row.decisionNote,
   marksheets:{uploaded:marks.count-marks.missing,expected:marks.count,missing:marks.missing},attention}];
 });
 // Authoritative counts are computed across the college's authorized filtered queue,
 // before pagination. Never infer tab totals from a truncated page.
 const counts:{WAITING:number;SENT_BACK:number;VERIFIED:number}={WAITING:0,SENT_BACK:0,VERIFIED:0};
 const legacyCounts={SUBMITTED:0,UPDATE_PENDING:0,SENT_BACK:0,VERIFIED:0};
 if(query&&!memberIds){
  const totals=await getDb().select({
   status:profileVerifications.status,total:sql<number>`count(*)::integer`,
  }).from(profileVerifications)
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,profileVerifications.learnerMembershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
   .where(and(eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"),
    ...(query.kind!=="ALL"?[eq(profileVerifications.section,query.kind)]:[]),
    ...(searchPattern?[or(ilike(users.displayName,searchPattern),ilike(learnerProfiles.rollNumber,searchPattern))]:[]),
    ...(academicMembers?[inArray(profileVerifications.learnerMembershipId,academicMembers)]:[]),
   )).groupBy(profileVerifications.status);
  for(const item of totals){
   if(item.status==="SUBMITTED"||item.status==="UPDATE_PENDING"){
    counts.WAITING+=item.total;
    legacyCounts[item.status]+=item.total;
   }else if(item.status==="SENT_BACK"){
    counts.SENT_BACK+=item.total;legacyCounts.SENT_BACK+=item.total;
   }else if(item.status==="VERIFIED"){
    counts.VERIFIED+=item.total;legacyCounts.VERIFIED+=item.total;
   }
  }
 }
 return {available:true,enabled:true,permitted:true,rows,hasMore:Boolean(query&&records.length>query.pageSize),
  ...(query&&!memberIds?{counts,legacyCounts}:{}),
 };
}

/** TPO detail history mirrors the legacy newest-first 50 event contract.
 * The new source keys by persisted learner membership and verification
 * section, never by an unscoped historical integer student ID.
 * Documents are granted separately; never include snapshots in list payloads.
 */
export async function getTpoVerificationHistory(
 ctx:RequestContext,learnerMembershipIdInput:string,
):Promise<Array<{section:string;action:string;actorName:string|null;
 note:string|null;createdAt:Date;priorVersion:number;nextVersion:number}>>{
 const collegeId=await requireTpoBatchActor(ctx);
 const learnerMembershipId=z.string().uuid().parse(learnerMembershipIdInput);
 const [setting,grant]=await Promise.all([
  getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
   .from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,collegeId)).limit(1),
  getDb().select({revokedAt:profileVerificationTpoGrants.revokedAt})
   .from(profileVerificationTpoGrants)
   .where(eq(profileVerificationTpoGrants.membershipId,ctx.membership!.id)).limit(1),
 ]);
 if(!effectiveTpoVerifierSetting(setting[0])||!tpoVerifierGrantAllowed(grant[0]))
  throw new Error("PROFILE_VERIFICATION_ACCESS_DENIED");
 const college=await loadPlacementCollegeScope(collegeId);
 requirePermission(ctx,"profile-verification.review",{
  collegeId,organizationId:college.organizationId,
  tpoVerificationAdministrator:true,tpoVerificationEnabled:true,
 });
 return getDb().select({
  section:profileVerifications.section,action:profileVerificationEvents.action,
  actorName:profileVerificationEvents.actorName,note:profileVerificationEvents.note,
  createdAt:profileVerificationEvents.createdAt,
  priorVersion:profileVerificationEvents.priorVersion,
  nextVersion:profileVerificationEvents.nextVersion,
 }).from(profileVerificationEvents)
 .innerJoin(profileVerifications,
  eq(profileVerifications.id,profileVerificationEvents.verificationId))
 .innerJoin(collegeMemberships,
  eq(collegeMemberships.id,profileVerifications.learnerMembershipId))
 .where(and(eq(profileVerifications.learnerMembershipId,learnerMembershipId),
  eq(collegeMemberships.collegeId,collegeId)))
 .orderBy(desc(profileVerificationEvents.createdAt),desc(profileVerificationEvents.id))
 .limit(50);
}
