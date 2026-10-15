import "server-only";
import {and,asc,desc,eq,ilike,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import {profileVerifications} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import type {VerificationStatus} from "@/modules/profile-verification/domain";
import {verificationQueueFilters,verificationWaitingStateValid} from "./queue-filters";
import {verificationSortDirection} from "./sort-model";
import {matchesVerificationAttention} from "./attention-filter";
import type {VerificationSection} from "@/modules/profile-verification/domain";
import {verificationLearnerNamePattern} from "./queue-name-pattern";
import {verificationTab} from "./queue-tabs";
import {matchesWaitingSince,matchesSubmittedFrom,verificationSubmissionWindowValid} from "./queue-waiting-since";
import {submittedMarksheets} from "./queue-mark-sheets";
import {verificationCsv} from "./queue-export";
import {requireCollegeVerificationActor,requireVerificationTables} from "./staff-auth";
import {requireSuperAdminVerificationCollege} from "./super-admin-scope";
import {verificationEnrollmentPredicates} from "./staff-filter-scope";
import {VerificationQueueLimitError} from "./staff-queue-service";

const fmt=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});
export async function exportCollegeVerificationCsv(context:RequestContext,raw:unknown,superAdminCollegeId?:string){
 const filter=verificationQueueFilters.parse(raw);
 if(!verificationSubmissionWindowValid(filter))throw Error("INVALID_VERIFICATION_SUBMISSION_WINDOW");
 if(!verificationWaitingStateValid(filter))throw Error("INVALID_VERIFICATION_WAITING_STATE");
 const scope=superAdminCollegeId ? await requireSuperAdminVerificationCollege(context,superAdminCollegeId) : await requireCollegeVerificationActor(context);
 await requireVerificationTables();
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
  inArray(profileVerifications.section,["EDUCATION","IDENTITY"]),
  inArray(profileVerifications.status,filter.waitingState==="ALL"?["SUBMITTED","UPDATE_PENDING","SENT_BACK","VERIFIED"]:[filter.waitingState]),
  ...verificationEnrollmentPredicates(scope.collegeId,filter)))
 .orderBy(verificationSortDirection(filter.sort)==="descending"?desc(profileVerifications.submittedAt):asc(profileVerifications.submittedAt),asc(collegeMemberships.id),asc(profileVerifications.section)).limit(5001);
 if(rows.length>5000)throw new VerificationQueueLimitError();
 const evaluatedAt=new Date();
 const selected=rows.filter(row=>{
  if(verificationTab({status:row.status as VerificationStatus})!==filter.tab)return false;
  if(filter.kind&&row.section!==filter.kind)return false;
  if(filter.waitingSince&&!matchesWaitingSince(row.submittedAt,filter.waitingSince))return false;
  if(!matchesSubmittedFrom(row.submittedAt,filter.submittedFrom))return false;
  const m=submittedMarksheets(row.snapshot);
  if(filter.marksheets==="MISSING"&&!(row.section==="EDUCATION"&&m.missing>0))return false;
  if(filter.marksheets==="PRESENT"&&!(row.section==="EDUCATION"&&m.count>0&&m.missing===0))return false;
  return matchesVerificationAttention({status:row.status as VerificationStatus,section:row.section as VerificationSection,
   submittedAt:row.submittedAt,missingMarksheet:row.section==="EDUCATION"&&m.missing>0},filter.attention,evaluatedAt);
 });
 const output=verificationCsv(selected.map(row=>({
  learnerName:row.learnerName?.trim()||"Learner",section:row.section,status:row.status,
  submittedAt:fmt.format(row.submittedAt),reviewedAt:row.decidedAt?fmt.format(row.decidedAt):"",
 })));
 return {...output,total:selected.length};
}
