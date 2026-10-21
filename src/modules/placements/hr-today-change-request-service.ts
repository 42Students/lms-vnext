import "server-only";
import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementDriveChangeRequests} from "@/db/schema/placement-drive-change-requests";
import {placementJobs} from "@/db/schema";

/** REC-home-drives-01: Today only exposes requests in the already authorized
 * recruiter job set. A TPO request targeted at COMPANY requires an answer. */
export async function listRecruiterTodayChangeRequests(collegeId:string,allowedJobIds:readonly string[]){
 const ids=[...new Set(allowedJobIds)];
 if(ids.length===0)return [];
 return getDb().select({
  id:placementDriveChangeRequests.id,jobId:placementJobs.id,
  // Window count covers every authorized OPEN company-facing request, not
  // only the 20 newest cards rendered in Today.
  totalOpen:sql<number>`count(*) over()::integer`.mapWith(Number),
  jobTitle:placementJobs.title,field:placementDriveChangeRequests.field,
  createdAt:placementDriveChangeRequests.createdAt,
 }).from(placementDriveChangeRequests)
  .innerJoin(placementJobs,eq(placementJobs.id,placementDriveChangeRequests.jobId))
  .where(and(inArray(placementDriveChangeRequests.jobId,ids),
   eq(placementJobs.collegeId,collegeId),
   inArray(placementJobs.status,["PUBLISHED","CLOSED"]),
   isNull(placementJobs.archivedAt),
   eq(placementDriveChangeRequests.status,"OPEN"),
   eq(placementDriveChangeRequests.targetParty,"COMPANY")))
  .orderBy(desc(placementDriveChangeRequests.createdAt)).limit(20);
}
