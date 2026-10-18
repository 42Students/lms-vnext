import "server-only";
import {and,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementDriveChangeRequests} from "@/db/schema/placement-drive-change-requests";
import {placementJobs} from "@/db/schema";

/** REC-home-drives-14: count only OPEN questions for this employer on an
 * already college-scoped, authorized page of job IDs. */
export async function countRecruiterAnswerableDriveRequests(
 collegeId:string,jobIds:readonly string[],
):Promise<Record<string,number>>{
 const ids=[...new Set(jobIds)];if(!ids.length)return {};
 const rows=await getDb().select({
  jobId:placementDriveChangeRequests.jobId,
  count:sql<number>`count(*)::integer`,
 }).from(placementDriveChangeRequests)
  .innerJoin(placementJobs,eq(placementJobs.id,placementDriveChangeRequests.jobId))
  .where(and(inArray(placementDriveChangeRequests.jobId,ids),
   eq(placementJobs.collegeId,collegeId),
   inArray(placementJobs.status,["PUBLISHED","CLOSED"]),
   isNull(placementJobs.archivedAt),
   eq(placementDriveChangeRequests.status,"OPEN"),
   eq(placementDriveChangeRequests.targetParty,"COMPANY")))
  .groupBy(placementDriveChangeRequests.jobId);
 return Object.fromEntries(rows.map(row=>[row.jobId,Number(row.count)]));
}
