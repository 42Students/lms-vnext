import "server-only";
import {and,asc,desc,eq,gte,lt,gt,lte,ilike,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import {profileVerifications} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import type {VerificationStatus} from "@/modules/profile-verification/domain";
import {verificationQueueFilters,verificationWaitingStateValid,verificationEnrollmentFiltersValid,verificationAgeBandValid,verificationSectionEvidenceFiltersValid,verificationWaitingAttentionValid,verificationAttentionAgeCompatible} from "./queue-filters";
import {verificationSortDirection} from "./sort-model";
import {verificationSqlSections} from "./queue-kind";
import {matchesVerificationAttention} from "./attention-filter";
import {matchesVerificationAgeBand,verificationAgeSqlBounds} from "./queue-age-band";
import type {VerificationSection} from "@/modules/profile-verification/domain";
import {verificationLearnerNamePattern} from "./queue-name-pattern";
import {verificationTab,verificationTabStatuses} from "./queue-tabs";
import {matchesWaitingSince,matchesSubmittedFrom,verificationSubmissionWindowValid,verificationSubmittedSqlBounds} from "./queue-waiting-since";
import {submittedMarksheets} from "./queue-mark-sheets";
import {verificationAttentionFlags} from "./attention-flags";
import {verificationCsv} from "./queue-export";
import {requireCollegeVerificationActor,requireVerificationTables} from "./staff-auth";
import {requireSuperAdminVerificationCollege} from "./super-admin-scope";
import {verificationEnrollmentPredicates} from "./staff-filter-scope";
import {VerificationQueueLimitError} from "./staff-queue-service";

const fmt=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});
export async function exportCollegeVerificationCsv(context:RequestContext,raw:unknown,superAdminCollegeId?:string){
 const filter=verificationQueueFilters.parse(raw);
 if(!verificationSubmissionWindowValid({ ...(filter.submittedFrom!==undefined?{submittedFrom:filter.submittedFrom}:{}), ...(filter.waitingSince!==undefined?{waitingSince:filter.waitingSince}:{}) }))throw Error("INVALID_VERIFICATION_SUBMISSION_WINDOW");
 if(!verificationWaitingStateValid(filter))throw Error("INVALID_VERIFICATION_WAITING_STATE");
 if(!verificationEnrollmentFiltersValid({ enrollment:filter.enrollment, ...(filter.programId!==undefined?{programId:filter.programId}:{}), ...(filter.batchId!==undefined?{batchId:filter.batchId}:{}), ...(filter.branchId!==undefined?{branchId:filter.branchId}:{}), ...(filter.sectionId!==undefined?{sectionId:filter.sectionId}:{}) }))throw Error("INVALID_VERIFICATION_ENROLLMENT_FILTERS");
 if(!verificationAgeBandValid(filter))throw Error("INVALID_VERIFICATION_AGE_BAND");
 if(!verificationSectionEvidenceFiltersValid({ marksheets:filter.marksheets,attention:filter.attention,...(filter.kind!==undefined?{kind:filter.kind}:{}) }))throw Error("INVALID_VERIFICATION_SECTION_EVIDENCE_FILTERS");
 if(!verificationWaitingAttentionValid(filter))throw Error("INVALID_VERIFICATION_ATTENTION_TAB");
 if(!verificationAttentionAgeCompatible(filter))throw Error("INVALID_VERIFICATION_ATTENTION_AGE");
 const scope=superAdminCollegeId ? await requireSuperAdminVerificationCollege(context,superAdminCollegeId) : await requireCollegeVerificationActor(context);
 await requireVerificationTables();
 const dateBounds=verificationSubmittedSqlBounds({ ...(filter.submittedFrom!==undefined?{submittedFrom:filter.submittedFrom}:{}), ...(filter.waitingSince!==undefined?{waitingSince:filter.waitingSince}:{}) });
 const evaluatedAt=new Date();
 const ageBounds=verificationAgeSqlBounds(filter.ageBand,evaluatedAt);
 const rows=await getDb().select({
  membershipId:collegeMemberships.id,learnerName:users.displayName,
  section:profileVerifications.section,status:profileVerifications.status,
  submittedAt:profileVerifications.submittedAt,decidedAt:profileVerifications.decidedAt,
  snapshot:profileVerifications.submittedSnapshot,
 }).from(profileVerifications)
 .innerJoin(collegeMemberships,eq(collegeMemberships.id,profileVerifications.learnerMembershipId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(eq(collegeMemberships.collegeId,scope.collegeId),
  filter.membershipId?eq(collegeMemberships.id,filter.membershipId):undefined,
  eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
  filter.q?ilike(users.displayName,verificationLearnerNamePattern(filter.q)):undefined,
  dateBounds.from?gte(profileVerifications.submittedAt,dateBounds.from):undefined,
  dateBounds.before?lt(profileVerifications.submittedAt,dateBounds.before):undefined,
  ageBounds.after?gt(profileVerifications.submittedAt,ageBounds.after):undefined,
  ageBounds.through?lte(profileVerifications.submittedAt,ageBounds.through):undefined,
  inArray(profileVerifications.section,verificationSqlSections(filter.kind)),
  inArray(profileVerifications.status,[...verificationTabStatuses(filter.tab,filter.waitingState)]),
  ...verificationEnrollmentPredicates(scope.collegeId,filter)))
 .orderBy(filter.sort==="NAME"?asc(sql`lower(${users.displayName})`):verificationSortDirection(filter.sort)==="descending"?desc(profileVerifications.submittedAt):asc(profileVerifications.submittedAt),asc(collegeMemberships.id),asc(profileVerifications.section)).limit(5001);
 if(rows.length>5000)throw new VerificationQueueLimitError();
 const selected=rows.filter(row=>{
  if(verificationTab({status:row.status as VerificationStatus})!==filter.tab)return false;
  if(filter.kind&&row.section!==filter.kind)return false;
  if(filter.waitingSince&&!matchesWaitingSince(row.submittedAt,filter.waitingSince))return false;
  if(!matchesSubmittedFrom(row.submittedAt,filter.submittedFrom))return false;
  if(!matchesVerificationAgeBand(row.submittedAt,row.status,filter.ageBand,evaluatedAt))return false;
  const m=submittedMarksheets(row.snapshot);
  if(filter.marksheets==="MISSING"&&!(row.section==="EDUCATION"&&m.missing>0))return false;
  if(filter.marksheets==="PRESENT"&&!(row.section==="EDUCATION"&&m.count>0&&m.missing===0))return false;
  return matchesVerificationAttention({status:row.status as VerificationStatus,section:row.section as VerificationSection,
   submittedAt:row.submittedAt,missingMarksheet:row.section==="EDUCATION"&&m.missing>0},filter.attention,evaluatedAt);
 });
 const output=verificationCsv(selected.map(row=>{
  const marks=submittedMarksheets(row.snapshot),section=row.section as VerificationSection;
  const flags=verificationAttentionFlags({status:row.status as VerificationStatus,section,submittedAt:row.submittedAt,
   missingMarksheet:section==="EDUCATION"&&marks.missing>0},evaluatedAt);
  return {learnerName:row.learnerName?.trim()||"Learner",section,status:row.status,
   submittedAt:fmt.format(row.submittedAt),reviewedAt:row.decidedAt?fmt.format(row.decidedAt):"",
   ...(section==="EDUCATION"?{educationEntryCount:marks.count,missingDocumentCount:marks.missing}:{}),
   attentionFlags:flags.map(flag=>flag.replaceAll("_"," ").toLowerCase()).join("; "),
  };
 }));
 return {...output,total:selected.length};
}
