import "server-only";
import {and,asc,eq,ilike,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users,learnerProgramEnrollments,cohorts,programs,departments} from "@/db/schema";
import {profileVerifications} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import {verificationQueueFilters} from "./queue-filters";
import {verificationLearnerNamePattern} from "./queue-name-pattern";
import {verificationTab,verificationTabCounts} from "./queue-tabs";
import {submittedMarksheets} from "./queue-mark-sheets";
import {verificationAttentionFlags} from "./attention-flags";
import {matchesWaitingSince} from "./queue-waiting-since";
import {requireCollegeVerificationActor,requireVerificationTables} from "./staff-auth";
import {verificationEnrollmentPredicates} from "./staff-filter-scope";
import type {VerificationQueueCard} from "@/components/verification/VerificationWorkspace";
import type {VerificationRecord,VerificationStatus,VerificationSection} from "@/modules/profile-verification/domain";

export class VerificationQueueLimitError extends Error {
 constructor(){super("VERIFICATION_QUEUE_LIMIT_REACHED");}
}
export async function listCollegeVerificationQueue(context:RequestContext,raw:unknown) {
 const filter=verificationQueueFilters.parse(raw);
 const scope=await requireCollegeVerificationActor(context);
 await requireVerificationTables();
 // Cap the working set and FAIL LOUDLY rather than silently reporting
 // truncated counts. Indexed DB-side paging is a later optimization.
 const rows=await getDb().select({
  membershipId:collegeMemberships.id,name:users.displayName,
  section:profileVerifications.section,status:profileVerifications.status,
  version:profileVerifications.rowVersion,submittedAt:profileVerifications.submittedAt,
  submittedSnapshot:profileVerifications.submittedSnapshot,
 }).from(profileVerifications)
 .innerJoin(collegeMemberships,eq(collegeMemberships.id,profileVerifications.learnerMembershipId))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
 .where(and(eq(collegeMemberships.collegeId,scope.collegeId),eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"),
   filter.q?ilike(users.displayName,verificationLearnerNamePattern(filter.q)):undefined,
   inArray(profileVerifications.section,["EDUCATION","IDENTITY"]),
   inArray(profileVerifications.status,["SUBMITTED","UPDATE_PENDING","VERIFIED","SENT_BACK"]),
   ...verificationEnrollmentPredicates(scope.collegeId,filter)))
 .orderBy(asc(profileVerifications.submittedAt),asc(collegeMemberships.id)).limit(5001);
 if(rows.length>5000)throw new VerificationQueueLimitError();
 const filtered=rows.filter(row=>{
  if(filter.kind&&row.section!==filter.kind)return false;
  if(filter.waitingSince&&!matchesWaitingSince(row.submittedAt,filter.waitingSince))return false;
  const marks=submittedMarksheets(row.submittedSnapshot);
  if(filter.marksheets==="MISSING"&&!(row.section==="EDUCATION"&&marks.missing>0))return false;
  if(filter.marksheets==="PRESENT"&&!(row.section==="EDUCATION"&&marks.count>0&&marks.missing===0))return false;
  return true;
 });
 const counts=verificationTabCounts(filtered.map(r=>({status:r.status as VerificationStatus})));
 const pageRows=filtered.filter(r=>verificationTab({status:r.status as VerificationStatus})===filter.tab);
 const start=(filter.page-1)*25;
 const sliced=pageRows.slice(start,start+25);
 const enrollmentIds=sliced.map(row=>row.membershipId);
 const enrollments=enrollmentIds.length?await getDb().select({
  membershipId:learnerProgramEnrollments.membershipId,
  batchName:cohorts.name,branchName:departments.name,
 }).from(learnerProgramEnrollments)
 .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
 .innerJoin(programs,and(eq(programs.id,learnerProgramEnrollments.programId),
   eq(programs.id,cohorts.programId)))
 .innerJoin(departments,and(eq(departments.id,programs.departmentId),
   eq(departments.collegeId,scope.collegeId)))
 .where(and(inArray(learnerProgramEnrollments.membershipId,enrollmentIds),
   eq(learnerProgramEnrollments.status,"ACTIVE"))):[];
 const byMember=new Map(enrollments.map(row=>[row.membershipId,row]));
 const cards:VerificationQueueCard[]=sliced.map(row=>{
  const marks=submittedMarksheets(row.submittedSnapshot);
  const status=row.status as VerificationStatus,section=row.section as VerificationSection;
  const missingMarksheet=section==="EDUCATION"&&marks.missing>0;
  const flags=verificationAttentionFlags({status,section,submittedAt:row.submittedAt,missingMarksheet},new Date());
  return {learnerMembershipId:row.membershipId,learnerName:row.name?.trim()||"Learner",
   section,status,version:row.version,submittedAt:row.submittedAt,batchName:byMember.get(row.membershipId)?.batchName??null,branchName:byMember.get(row.membershipId)?.branchName??null,
   missingMarksheet,attention:flags.map(flag=>flag.replaceAll("_"," ").toLowerCase())};
 });
 return {rows:cards,counts,total:pageRows.length,page:filter.page,hasMore:start+25<pageRows.length,filter};
}
