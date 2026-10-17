import "server-only";
import {and,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,placementOffers,placementJobs,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";

/** Only counts records which have already been shared by a TPO shortlist.
 * The caller supplies job IDs from listOwnRecruiterPlacementJobs and a granted
 * college; private applications and screening decisions never enter this count. */
export async function recruiterVisiblePortfolioCounts(context:RequestContext,
 collegeId:string,authorizedJobIds:readonly string[]){
 const activeGrant=context.recruiter?.grants.find(g=>g.collegeId===collegeId);
 if(!hasActiveRecruiter(context)||!activeGrant)
  throw new AuthorizationError("placements.recruiter.read");
 const ids=[...new Set(authorizedJobIds)].slice(0,20);
 if(ids.length===0)return {} as Record<string,{sharedApplicants:number;offers:number}>;
 const db=getDb();
 const scope=and(inArray(placementApplications.jobId,ids),
  recruiterOwnJobPredicate(context.user.id),
  eq(collegeMemberships.collegeId,collegeId),
  eq(collegeMemberships.status,"ACTIVE"),
  eq(users.platformStatus,"ACTIVE"),
  eq(placementApplicationScreenings.status,"SHORTLISTED"));
 // Every job is re-scoped against the same college grant in the parent call.
 requirePermission(context,"placements.recruiter.read",{
   collegeId,placementCompanyRelationshipId:activeGrant.companyRelationshipId,
 });
 const [shared,offers]=await Promise.all([
  db.select({jobId:placementApplications.jobId,n:sql<number>`count(distinct ${placementApplications.id})::integer`})
   .from(placementApplications)
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(scope).groupBy(placementApplications.jobId),
  db.select({jobId:placementApplications.jobId,n:sql<number>`count(distinct ${placementOffers.applicationId})::integer`})
   .from(placementOffers).innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(scope).groupBy(placementApplications.jobId),
 ]);
 const counts:Record<string,{sharedApplicants:number;offers:number}>={};
 for(const id of ids)counts[id]={sharedApplicants:0,offers:0};
 for(const row of shared)counts[row.jobId]!.sharedApplicants=Number(row.n);
 for(const row of offers)counts[row.jobId]!.offers=Number(row.n);
 return counts;
}
