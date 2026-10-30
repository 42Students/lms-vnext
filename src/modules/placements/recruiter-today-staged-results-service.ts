import "server-only";
import {and,desc,eq,gt,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 placementRoundResults,placementJobRounds,placementJobs,
 placementCompanyRelationships,placementCompanies,
 placementRecruiterProfiles,placementRecruiterCollegeGrants,
} from "@/db/schema";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";
import {hasActiveRecruiter} from "@/modules/identity/context";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {recruiterTodayStagedResultsWaiting} from "./recruiter-today-staged-results-model";

/** Legacy Today "results are with placement cell". A current recruiter-STAGED
 * submission is visible only to its authenticated author, on an employer-owned
 * drive with a persisted active, verified, unexpired exact relationship grant.
 * No candidate names or scores leave this aggregate. */
export async function listRecruiterTodayStagedResultsWaiting(
 context:RequestContext,collegeId:string,authorizedJobIds:readonly string[],
){
 const recruiter=context.recruiter;
 if(!hasActiveRecruiter(context)||!recruiter||recruiter.userId!==context.user.id)
  throw new AuthorizationError("placements.recruiter.read");
 const grants=recruiter.grants.filter(g=>g.collegeId===collegeId);
 if(!grants.length)throw new AuthorizationError("placements.recruiter.read");
 for(const grant of grants)requirePermission(context,"placements.recruiter.read",{
  collegeId,placementCompanyRelationshipId:grant.companyRelationshipId,
 });
 const ids=[...new Set(authorizedJobIds)];
 if(!ids.length)return [];
 const rows=await getDb().select({
  roundId:placementJobRounds.id,roundName:placementJobRounds.name,
  jobId:placementJobs.id,jobTitle:placementJobs.title,
  count:sql<number>`count(distinct ${placementRoundResults.applicationId})::integer`,
 }).from(placementRoundResults)
  .innerJoin(placementJobRounds,eq(placementJobRounds.id,placementRoundResults.roundId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
   eq(placementCompanyRelationships.status,"ACTIVE"),
   inArray(placementCompanyRelationships.id,grants.map(g=>g.companyRelationshipId)),
  ))
  .innerJoin(placementCompanies,and(
   eq(placementCompanies.id,placementCompanyRelationships.companyId),
   eq(placementCompanies.id,recruiter.companyId),
   eq(placementCompanies.status,"ACTIVE"),
  ))
  .innerJoin(placementRecruiterProfiles,and(
   eq(placementRecruiterProfiles.userId,context.user.id),
   eq(placementRecruiterProfiles.companyId,placementCompanies.id),
   eq(placementRecruiterProfiles.status,"ACTIVE"),
  ))
  .innerJoin(placementRecruiterCollegeGrants,and(
   eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
   eq(placementRecruiterCollegeGrants.companyRelationshipId,placementCompanyRelationships.id),
   eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
   eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
   gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
   sql<boolean>`'DRIVES'=ANY(${placementRecruiterCollegeGrants.capabilities})`,
  ))
  .where(and(
   inArray(placementJobs.id,ids),eq(placementJobs.collegeId,collegeId),
   inArray(placementJobs.status,["PUBLISHED","CLOSED"]),
   // DB-072 transitional provenance: recruiter-owned results written by
   // pre-cutover HR producers and post-expand RECRUITER producers are the
   // same logical category. The strict migration runs only after old writers
   // are drained; the read side must safely understand both meanwhile.
   sql<boolean>`${placementRoundResults.source} in ('HR','RECRUITER')`,
   eq(placementRoundResults.status,"STAGED"),
   eq(placementRoundResults.submittedByUserId,context.user.id),
   recruiterOwnJobPredicate(context.user.id),
  ))
  .groupBy(placementJobRounds.id,placementJobRounds.name,placementJobs.id,placementJobs.title)
  .orderBy(desc(sql`max(${placementRoundResults.submittedAt})`))
  .limit(8);
 return recruiterTodayStagedResultsWaiting(rows.map(row=>({...row,count:Number(row.count)})));
}
