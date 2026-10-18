import "server-only";
import {and,asc,eq,exists,gte,ilike,lte,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 colleges,departments,programs,learnerProgramEnrollments,cohorts,
 collegeMemberships,placementApplications,placementCompanies,
 placementCompanyRelationships,placementJobs,placementApplicationScreenings,
} from "@/db/schema";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {superAdminHiringReportQuery,SUPER_ADMIN_HIRING_EXPORT_CAP,type SuperAdminHiringRow} from "./super-admin-hiring-report-model";
export async function getSuperAdminCompanyHiringReport(context:RequestContext,raw:unknown){
 const query=superAdminHiringReportQuery.parse(raw);
 const selected=requireSuperAdminSelectedCollege(context,"placements.read"),db=getDb();
 const pattern=query.q?"%"+query.q.replace(/[\\%_]/g,"\\$&")+"%":null;
 const matchingAcademic= query.departmentId||query.programId||query.cohortId
  ?exists(db.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
    .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,selected.collegeId)))
    .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
    .where(and(eq(learnerProgramEnrollments.membershipId,placementApplications.membershipId),
      eq(learnerProgramEnrollments.status,"ACTIVE"),
      query.departmentId?eq(departments.id,query.departmentId):undefined,
      query.programId?eq(programs.id,query.programId):undefined,
      query.cohortId?eq(cohorts.id,query.cohortId):undefined))) : undefined;
 const stage=sql<string>`coalesce(${placementCollegeApplicationStages.stage}, case when ${placementApplicationScreenings.status} = 'SHORTLISTED' then 'SHORTLISTED' when ${placementApplicationScreenings.status} = 'REJECTED' then 'REJECTED' else 'APPLIED' end)`;
 const tally=(name:string)=>sql<number>`count(distinct ${placementApplications.id}) filter (where ${placementApplications.status} = 'SUBMITTED' and ${stage} = ${name})::integer`.mapWith(Number);
 const applicationFilters=and(
  query.appliedFrom?gte(placementApplications.submittedAt,new Date(query.appliedFrom+"T00:00:00+05:30")):undefined,
  query.appliedTo?lte(placementApplications.submittedAt,new Date(query.appliedTo+"T23:59:59.999+05:30")):undefined,
  matchingAcademic,
 );
 const result=await db.select({
  companyId:placementCompanies.id,companyName:placementCompanies.name,
  jobId:placementJobs.id,jobTitle:placementJobs.title,
  totalApplications:sql<number>`count(distinct ${placementApplications.id})::integer`.mapWith(Number),
  applied:tally("APPLIED"),
  withdrawn:sql<number>`count(distinct ${placementApplications.id}) filter (where ${placementApplications.status} = 'WITHDRAWN')::integer`.mapWith(Number),
  waitlisted:tally("WAITLISTED"),
  shortlisted:tally("SHORTLISTED"),assessment:tally("ASSESSMENT"),interview:tally("INTERVIEW"),
  offered:tally("OFFERED"),hired:tally("HIRED"),rejected:tally("REJECTED"),
 }).from(placementJobs)
  .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,selected.collegeId)))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),
    eq(colleges.id,selected.collegeId),
    selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
  // Keep zero-application jobs in this LEFT JOIN, but never let an
  // application with a foreign-college membership into the aggregates.
  // A separate LEFT JOIN on memberships is insufficient: COUNT(application.id)
  // still includes the unmatched foreign application.
  .leftJoin(placementApplications,and(
    eq(placementApplications.jobId,placementJobs.id),
    applicationFilters,
    exists(db.select({id:collegeMemberships.id}).from(collegeMemberships)
      .where(and(eq(collegeMemberships.id,placementApplications.membershipId),
        eq(collegeMemberships.collegeId,selected.collegeId)))),
  ))
  .leftJoin(placementCollegeApplicationStages,and(
    eq(placementCollegeApplicationStages.applicationId,placementApplications.id),
    eq(placementCollegeApplicationStages.jobId,placementJobs.id)))
  .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .where(and(
    query.jobId?eq(placementJobs.id,query.jobId):undefined,
    pattern?or(ilike(placementJobs.title,pattern),ilike(placementCompanies.name,pattern)):undefined,
  ))
  .groupBy(placementJobs.id,placementJobs.title,placementCompanies.id,placementCompanies.name)
  .orderBy(asc(placementCompanies.name),asc(placementJobs.title),asc(placementJobs.id))
  .limit(SUPER_ADMIN_HIRING_EXPORT_CAP+1);
 return {query,rows:result.slice(0,SUPER_ADMIN_HIRING_EXPORT_CAP) as SuperAdminHiringRow[],
  truncated:result.length>SUPER_ADMIN_HIRING_EXPORT_CAP};
}
