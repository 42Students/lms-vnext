import "server-only";
import {and,desc,eq,gt,gte,inArray,isNull,lt,ne,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJoiningOutcomes,placementJobs,placementOffers,placementRecruiterCollegeGrants,
 users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {getRecruiterPlacementWorkspace} from "./recruiter-workspace-service";
import {recruiterPreviousIstCalendarYear} from "./recruiter-historical-offers-model";

/** Historical employer offers are NOT public alumni records. Read only
 * shortlisted learner rows from a prior CLOSED drive of the same verified
 * college/company relationship. Recheck the persisted DRIVES grant in SQL
 * so an expired credential cannot use the current job as a stale read token.
 */
export async function getRecruiterHistoricalOffers(
 context:RequestContext,jobId:string,now=new Date(),
){
 const workspace=await getRecruiterPlacementWorkspace(context,jobId);
 const range=recruiterPreviousIstCalendarYear(now);
 const jobs=await getDb().select({
  id:placementOffers.id,
  student:users.displayName,
  role:placementJobs.title,
  status:placementOffers.status,
  joiningStatus:placementJoiningOutcomes.status,
  joiningDate:placementJoiningOutcomes.joiningDate,
 }).from(placementOffers)
 .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
 .innerJoin(placementJobs,and(
  eq(placementJobs.id,placementApplications.jobId),
  ne(placementJobs.id,workspace.job.id),
  eq(placementJobs.companyRelationshipId,workspace.job.companyRelationshipId),
  eq(placementJobs.collegeId,workspace.college.id),
  eq(placementJobs.status,"CLOSED"),isNull(placementJobs.archivedAt)))
 .innerJoin(placementRecruiterCollegeGrants,and(
  eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
  eq(placementRecruiterCollegeGrants.companyRelationshipId,workspace.job.companyRelationshipId),
  eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
  eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
  gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
  sql<boolean>`'DRIVES' = ANY(${placementRecruiterCollegeGrants.capabilities})`))
 .innerJoin(placementApplicationScreenings,and(
  eq(placementApplicationScreenings.applicationId,placementApplications.id),
  eq(placementApplicationScreenings.status,"SHORTLISTED")))
 .innerJoin(collegeMemberships,and(
  eq(collegeMemberships.id,placementApplications.membershipId),
  eq(collegeMemberships.collegeId,workspace.college.id),
  eq(collegeMemberships.status,"ACTIVE")))
 .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
  eq(users.platformStatus,"ACTIVE")))
 .leftJoin(placementJoiningOutcomes,eq(placementJoiningOutcomes.offerId,placementOffers.id))
 .where(and(
  inArray(placementOffers.status,["ISSUED","ACCEPTED","DECLINED","EXPIRED","WITHDRAWN"]),
  gte(placementOffers.issuedAt,range.start),lt(placementOffers.issuedAt,range.end)))
 .orderBy(desc(placementOffers.issuedAt),desc(placementOffers.id))
 .limit(11);
 return {year:range.year,rows:jobs.slice(0,10),truncated:jobs.length>10};
}
