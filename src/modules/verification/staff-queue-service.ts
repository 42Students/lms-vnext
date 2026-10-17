import "server-only";
import {and,asc,desc,eq,gte,lt,gt,lte,ilike,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users,learnerProgramEnrollments,cohorts,programs,departments} from "@/db/schema";
import {profileVerifications,profileVerificationSettings} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import {verificationQueueFilters,verificationWaitingStateValid,verificationEnrollmentFiltersValid,verificationAgeBandValid,verificationSectionEvidenceFiltersValid,verificationWaitingAttentionValid,verificationAttentionAgeCompatible} from "./queue-filters";
import {verificationSortDirection} from "./sort-model";
import {verificationSqlSections} from "./queue-kind";
import {matchesVerificationAttention} from "./attention-filter";
import {matchesVerificationAgeBand,verificationAgeSqlBounds} from "./queue-age-band";
import {verificationLearnerNamePattern} from "./queue-name-pattern";
import {effectiveTpoVerifierSetting} from "./switch-state";
import {verificationTab,verificationTabCounts} from "./queue-tabs";
import {submittedMarksheets} from "./queue-mark-sheets";
import {verificationDocumentManifest} from "./document-manifest";
import {verificationAttentionFlags} from "./attention-flags";
import {matchesWaitingSince,matchesSubmittedFrom,verificationSubmissionWindowValid,verificationSubmittedSqlBounds} from "./queue-waiting-since";
import {requireCollegeVerificationActor,requireVerificationTables} from "./staff-auth";
import {requireSuperAdminVerificationCollege} from "./super-admin-scope";
import {verificationEnrollmentPredicates} from "./staff-filter-scope";
import type {VerificationQueueCard} from "@/components/verification/VerificationWorkspace";
import type {VerificationStatus,VerificationSection} from "@/modules/profile-verification/domain";

export class VerificationQueueLimitError extends Error {
 constructor(){super("VERIFICATION_QUEUE_LIMIT_REACHED");}
}
export async function listCollegeVerificationQueue(context:RequestContext,raw:unknown,superAdminCollegeId?:string) {
 const filter=verificationQueueFilters.parse(raw);
 if(!verificationSubmissionWindowValid(filter))throw Error("INVALID_VERIFICATION_SUBMISSION_WINDOW");
 if(!verificationWaitingStateValid(filter))throw Error("INVALID_VERIFICATION_WAITING_STATE");
 if(!verificationEnrollmentFiltersValid(filter))throw Error("INVALID_VERIFICATION_ENROLLMENT_FILTERS");
 if(!verificationAgeBandValid(filter))throw Error("INVALID_VERIFICATION_AGE_BAND");
 if(!verificationSectionEvidenceFiltersValid(filter))throw Error("INVALID_VERIFICATION_SECTION_EVIDENCE_FILTERS");
 if(!verificationWaitingAttentionValid(filter))throw Error("INVALID_VERIFICATION_ATTENTION_TAB");
 if(!verificationAttentionAgeCompatible(filter))throw Error("INVALID_VERIFICATION_ATTENTION_AGE");
 const scope=superAdminCollegeId ? await requireSuperAdminVerificationCollege(context,superAdminCollegeId) : await requireCollegeVerificationActor(context);
 await requireVerificationTables();
 const dateBounds=verificationSubmittedSqlBounds(filter);
 const evaluatedAt=new Date();
 const ageBounds=verificationAgeSqlBounds(filter.ageBand,evaluatedAt);
 const [setting]=await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles}).from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,scope.collegeId)).limit(1);
 const tpoCanVerify=effectiveTpoVerifierSetting(setting);
 // Cap the working set and FAIL LOUDLY rather than silently reporting
 // truncated counts. Indexed DB-side paging is a later optimization.
 const candidateRows=await getDb().select({
  membershipId:collegeMemberships.id,name:users.displayName,
  section:profileVerifications.section,status:profileVerifications.status,
  version:profileVerifications.rowVersion,submittedAt:profileVerifications.submittedAt,
  submittedSnapshot:profileVerifications.submittedSnapshot,
 }).from(profileVerifications)
 .innerJoin(collegeMemberships,eq(collegeMemberships.id,profileVerifications.learnerMembershipId))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
 .where(and(eq(collegeMemberships.collegeId,scope.collegeId),eq(collegeMemberships.status,"ACTIVE"),
   filter.membershipId?eq(collegeMemberships.id,filter.membershipId):undefined,
   eq(users.platformStatus,"ACTIVE"),filter.q?ilike(users.displayName,verificationLearnerNamePattern(filter.q)):undefined,
   dateBounds.from?gte(profileVerifications.submittedAt,dateBounds.from):undefined,
   dateBounds.before?lt(profileVerifications.submittedAt,dateBounds.before):undefined,
   ageBounds.after?gt(profileVerifications.submittedAt,ageBounds.after):undefined,
   ageBounds.through?lte(profileVerifications.submittedAt,ageBounds.through):undefined,
   inArray(profileVerifications.section,verificationSqlSections(filter.kind)),
   inArray(profileVerifications.status,filter.waitingState==="ALL"?["SUBMITTED","UPDATE_PENDING","VERIFIED","SENT_BACK"]:[filter.waitingState]),
   ...verificationEnrollmentPredicates(scope.collegeId,filter)))
 .orderBy(filter.sort==="NAME"?asc(sql`lower(${users.displayName})`):verificationSortDirection(filter.sort)==="descending"?desc(profileVerifications.submittedAt):asc(profileVerifications.submittedAt),asc(collegeMemberships.id),asc(profileVerifications.section)).limit(1001);
 const truncated=candidateRows.length>1000;
 const rows=candidateRows.slice(0,1000);
 const filtered=rows.filter(row=>{
  if(filter.kind&&row.section!==filter.kind)return false;
  if(filter.waitingSince&&!matchesWaitingSince(row.submittedAt,filter.waitingSince))return false;
  if(!matchesSubmittedFrom(row.submittedAt,filter.submittedFrom))return false;
  if(!matchesVerificationAgeBand(row.submittedAt,row.status,filter.ageBand,evaluatedAt))return false;
  const marks=submittedMarksheets(row.submittedSnapshot);
  if(filter.marksheets==="MISSING"&&!(row.section==="EDUCATION"&&marks.missing>0))return false;
  if(filter.marksheets==="PRESENT"&&!(row.section==="EDUCATION"&&marks.count>0&&marks.missing===0))return false;
  return matchesVerificationAttention({status:row.status as VerificationStatus,section:row.section as VerificationSection,
   submittedAt:row.submittedAt,missingMarksheet:row.section==="EDUCATION"&&marks.missing>0},filter.attention,evaluatedAt);
 });
 const counts=verificationTabCounts(filtered.map(r=>({status:r.status as VerificationStatus})));
 const pageRows=filtered.filter(r=>verificationTab({status:r.status as VerificationStatus})===filter.tab);
 const start=(filter.page-1)*filter.pageSize;
 const sliced=pageRows.slice(start,start+filter.pageSize);
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
  const flags=verificationAttentionFlags({status,section,submittedAt:row.submittedAt,missingMarksheet},evaluatedAt);
  return {learnerMembershipId:row.membershipId,learnerName:row.name?.trim()||"Learner",
   section,status,version:row.version,submittedAt:row.submittedAt,batchName:byMember.get(row.membershipId)?.batchName??null,branchName:byMember.get(row.membershipId)?.branchName??null,
   missingMarksheet,missingIdentityProof:section==="IDENTITY" &&
     !verificationDocumentManifest(row.submittedSnapshot).some(ref=>ref.purpose==="AADHAAR"||ref.purpose==="PAN"),
   marksheets:{uploaded:marks.count-marks.missing,expected:marks.count,missing:marks.missing},
   attention:flags.map(flag=>flag.replaceAll("_"," ").toLowerCase())};
 });
 return {rows:cards,counts,total:pageRows.length,page:filter.page,hasMore:start+filter.pageSize<pageRows.length,filter,tpoCanVerify,truncated};
}
