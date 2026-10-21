import "server-only";
import {and,eq,isNull,sql,type SQL} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 collegeMemberships,departments,learnerProgramEnrollments,membershipRoles,
 placementCandidateAcademicEvidence,programs,users,
} from "@/db/schema";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

/** Suppression occurs within grouped SQL, before any counts reach JS.
 * No learner-level evidence, unsuppressed group counts or names are returned. */
const MIN_GROUP=10;
export type RecruiterCollegeDemographics={
 totalLearners:number|null;
 byBranch:{branch:string;roundedCount:number}[];
 verifiedCgpaBands:{label:string;roundedCount:number}[];
 policy:"ROUNDED_MIN_10";
};

export async function getRecruiterCollegeDemographics(
 context:RequestContext,collegeId:string,
):Promise<RecruiterCollegeDemographics>{
 const recruiter=context.recruiter;
 if(!hasActiveRecruiter(context)||!recruiter||recruiter.userId!==context.user.id)
  throw new AuthorizationError("placements.recruiter.read");
 const grant=recruiter.grants.find(row=>row.collegeId===collegeId);
 if(!grant)throw new AuthorizationError("placements.recruiter.read");
 requirePermission(context,"placements.recruiter.read",{
  collegeId,placementCompanyRelationshipId:grant.companyRelationshipId,
 });

 const db=getDb();
 const active=and(
  eq(collegeMemberships.collegeId,collegeId),
  eq(collegeMemberships.status,"ACTIVE"),
  eq(users.platformStatus,"ACTIVE"),
 );
 const countDistinctLearners=sql<number>`count(distinct ${collegeMemberships.id})`;
 const rounded=(value:SQL<number>)=>
  sql<number>`(round((${value})::numeric / 5)*5)::integer`.mapWith(Number);
 const learnerRole=and(
  eq(membershipRoles.membershipId,collegeMemberships.id),
  eq(membershipRoles.role,"LEARNER"),
 );
 const bucket=sql<string>`case
  when ${placementCandidateAcademicEvidence.cgpaHundredths} < 600 then 'Below 6'
  when ${placementCandidateAcademicEvidence.cgpaHundredths} < 700 then '6 to 7'
  when ${placementCandidateAcademicEvidence.cgpaHundredths} < 800 then '7 to 8'
  when ${placementCandidateAcademicEvidence.cgpaHundredths} < 900 then '8 to 9'
  else '9 and above' end`;
 const [totals,branches,bands]=await Promise.all([
  db.select({total:sql<number|null>`case when ${countDistinctLearners} >= ${MIN_GROUP}
   then (round((${countDistinctLearners})::numeric / 5)*5)::integer else null end`})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,learnerRole).where(active),
  db.select({branch:departments.name,roundedCount:rounded(countDistinctLearners)})
   .from(learnerProgramEnrollments)
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,learnerRole)
   .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),
    eq(departments.collegeId,collegeId),isNull(departments.archivedAt)))
   .where(and(active,eq(learnerProgramEnrollments.status,"ACTIVE")))
   .groupBy(departments.id,departments.name)
   .having(sql`${countDistinctLearners} >= ${MIN_GROUP}`),
  db.select({label:bucket,roundedCount:rounded(countDistinctLearners)})
   .from(placementCandidateAcademicEvidence)
   .innerJoin(collegeMemberships,
    eq(collegeMemberships.id,placementCandidateAcademicEvidence.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,learnerRole)
   .where(and(active,
    eq(placementCandidateAcademicEvidence.source,"VERIFIED"),
    sql`${placementCandidateAcademicEvidence.verifiedAt} is not null`,
    sql`${placementCandidateAcademicEvidence.cgpaHundredths} between 0 and 1000`,
   ))
   .groupBy(bucket)
   .having(sql`${countDistinctLearners} >= ${MIN_GROUP}`),
 ]);
 return {
  totalLearners:totals[0]?.total??null,
  byBranch:branches.map(row=>({branch:row.branch,roundedCount:row.roundedCount})),
  verifiedCgpaBands:bands.map(row=>({label:row.label,roundedCount:row.roundedCount})),
  policy:"ROUNDED_MIN_10",
 };
}
