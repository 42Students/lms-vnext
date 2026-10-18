import "server-only";
import {and,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJobs,placementOffers,users} from "@/db/schema";
import {prioritizeRecruiterOfferFollowups} from "./hr-today-offer-followup-model";

/** REC-home-drives-01: count offer follow-ups on the college-shared
 * applicant population only; never disclose unshared learner identities. */
export async function listRecruiterTodayOfferActions(collegeId:string,
 authorizedJobIds:readonly string[]){
 const ids=[...new Set(authorizedJobIds)];if(!ids.length)return [];
 const rows=await getDb().select({
  jobId:placementJobs.id,jobTitle:placementJobs.title,status:placementOffers.status,
  count:sql<number>`count(distinct ${placementOffers.applicationId})::integer`,
 }).from(placementOffers)
  .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(inArray(placementJobs.id,ids),eq(placementJobs.collegeId,collegeId),
   eq(placementJobs.status,"PUBLISHED"),
   isNull(placementJobs.archivedAt),
   // A withdrawn candidate must not resurface in the recruiter's queue
   // just because old shortlisted screening and offer records remain.
   eq(placementApplications.status,"SUBMITTED"),
   eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"),
   eq(placementApplicationScreenings.status,"SHORTLISTED"),
   inArray(placementOffers.status,["ISSUED","ACCEPTED","DECLINED"])))
  .groupBy(placementJobs.id,placementJobs.title,placementOffers.status);
 return prioritizeRecruiterOfferFollowups(
  rows.map(row=>({...row,count:Number(row.count)})),
 );
}
