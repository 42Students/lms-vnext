import "server-only";
import {and,asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,departments,learnerProgramEnrollments,membershipRoles,
 placementCandidateAcademicEvidence,programs,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {buildRecruiterCollegeAcademicBands,RECRUITER_OVERVIEW_MIN_GROUP} from "./recruiter-company-overview-model";

/** Only rounded, minimum-cohort aggregates leave this server-only boundary.
 * This does not expose learner identifiers, raw marks or contact information.
 */
export async function recruiterCollegeAcademicOverview(context:RequestContext,collegeId:string){
 const recruiter=context.recruiter;
 if(!hasActiveRecruiter(context)||!recruiter||recruiter.userId!==context.user.id)
  throw new AuthorizationError("placements.recruiter.read");
 const grant=recruiter.grants.find(item=>item.collegeId===collegeId);
 if(!grant)throw new AuthorizationError("placements.recruiter.read");
 requirePermission(context,"placements.recruiter.read",{
  collegeId,placementCompanyRelationshipId:grant.companyRelationshipId,
 });
 const records=await getDb().select({
  membershipId:collegeMemberships.id,
  branchName:departments.name,
  cgpaHundredths:placementCandidateAcademicEvidence.cgpaHundredths,
 }).from(learnerProgramEnrollments)
 .innerJoin(collegeMemberships,and(
  eq(collegeMemberships.id,learnerProgramEnrollments.membershipId),
  eq(collegeMemberships.collegeId,collegeId),
  eq(collegeMemberships.status,"ACTIVE")))
 .innerJoin(users,and(
  eq(users.id,collegeMemberships.userId),
  eq(users.platformStatus,"ACTIVE")))
 .innerJoin(membershipRoles,and(
  eq(membershipRoles.membershipId,collegeMemberships.id),
  eq(membershipRoles.role,"LEARNER")))
 .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
 .innerJoin(departments,and(
  eq(departments.id,programs.departmentId),
  eq(departments.collegeId,collegeId)))
 .leftJoin(placementCandidateAcademicEvidence,
  eq(placementCandidateAcademicEvidence.membershipId,collegeMemberships.id))
 .where(eq(learnerProgramEnrollments.status,"ACTIVE"))
 .orderBy(asc(collegeMemberships.id));
 // Each active learner is counted once even if they have multiple enrolments.
 const unique=new Map<string,{branchName:string;cgpa:number|null}>();
 for(const record of records){
  if(unique.has(record.membershipId))continue;
  const hundredths=record.cgpaHundredths;
  unique.set(record.membershipId,{branchName:record.branchName,
   cgpa:typeof hundredths==="number"&&Number.isFinite(hundredths)
    ?hundredths/100:null});
 }
 const facts=[...unique.values()];
 const aggregate=buildRecruiterCollegeAcademicBands(facts);
 return {
  ...aggregate,
  studentsTotal:facts.length>=RECRUITER_OVERVIEW_MIN_GROUP?
   Math.round(facts.length/5)*5:null,
  asOf:new Date().toISOString(),
 };
}
