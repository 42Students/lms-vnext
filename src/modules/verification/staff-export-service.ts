import "server-only";
import {and,asc,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import {profileVerifications} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import type {VerificationStatus} from "@/modules/profile-verification/domain";
import {verificationQueueFilters} from "./queue-filters";
import {verificationTab} from "./queue-tabs";
import {matchesWaitingSince} from "./queue-waiting-since";
import {submittedMarksheets} from "./queue-mark-sheets";
import {verificationCsv} from "./queue-export";
import {requireCollegeVerificationActor,requireVerificationTables} from "./staff-auth";
import {verificationEnrollmentPredicates} from "./staff-filter-scope";
import {VerificationQueueLimitError} from "./staff-queue-service";

const fmt=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});
export async function exportCollegeVerificationCsv(context:RequestContext,raw:unknown){
 const filter=verificationQueueFilters.parse(raw);
 const scope=await requireCollegeVerificationActor(context);
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
  eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
  inArray(profileVerifications.section,["EDUCATION","IDENTITY"]),
  inArray(profileVerifications.status,["SUBMITTED","UPDATE_PENDING","SENT_BACK","VERIFIED"]),
  ...verificationEnrollmentPredicates(scope.collegeId,filter)))
 .orderBy(asc(profileVerifications.submittedAt),asc(collegeMemberships.id)).limit(5001);
 if(rows.length>5000)throw new VerificationQueueLimitError();
 const selected=rows.filter(row=>{
  if(verificationTab({status:row.status as VerificationStatus})!==filter.tab)return false;
  if(filter.kind&&row.section!==filter.kind)return false;
  if(filter.waitingSince&&!matchesWaitingSince(row.submittedAt,filter.waitingSince))return false;
  const m=submittedMarksheets(row.snapshot);
  if(filter.marksheets==="MISSING"&&!(row.section==="EDUCATION"&&m.missing>0))return false;
  if(filter.marksheets==="PRESENT"&&!(row.section==="EDUCATION"&&m.count>0&&m.missing===0))return false;
  return true;
 });
 const output=verificationCsv(selected.map(row=>({
  learnerName:row.learnerName?.trim()||"Learner",section:row.section,status:row.status,
  submittedAt:fmt.format(row.submittedAt),reviewedAt:row.decidedAt?fmt.format(row.decidedAt):"",
 })));
 return {...output,total:selected.length};
}
