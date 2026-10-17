import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementRecruiterDriveRequests} from "@/db/schema/placement-drive-requests";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

type JobItem={job:{id:string;createdByUserId:string};collegeId:string;relationshipId:string};

/** Creator or approved request attribution, never an ownership permission grant.
 * Team totals cannot expose unpublished drives or another employer/college. */
export async function recruiterTeamAttributedDriveCounts(context:RequestContext,
 collegeId:string,relationshipId:string,authorizedJobs:readonly JobItem[]){
 const grant=context.recruiter?.grants.find(g=>
   g.collegeId===collegeId&&g.companyRelationshipId===relationshipId);
 if(!grant)throw new AuthorizationError("placements.recruiter.read");
 requirePermission(context,"placements.recruiter.read",{collegeId,placementCompanyRelationshipId:relationshipId});
 const selected=authorizedJobs.filter(row=>
   row.collegeId===collegeId&&row.relationshipId===relationshipId);
 const ids=selected.map(row=>row.job.id);
 if(!ids.length)return {} as Record<string,number>;
 const requests=await getDb().select({
  userId:placementRecruiterDriveRequests.recruiterUserId,
  jobId:placementRecruiterDriveRequests.approvedJobId,
 }).from(placementRecruiterDriveRequests).where(and(
   eq(placementRecruiterDriveRequests.collegeId,collegeId),
   eq(placementRecruiterDriveRequests.companyRelationshipId,relationshipId),
   inArray(placementRecruiterDriveRequests.approvedJobId,ids),
 ));
 const byJob=new Map<string,string>();
 for(const row of requests)if(row.jobId)byJob.set(row.jobId,row.userId);
 const counts:Record<string,number>={};
 for(const row of selected){
   const userId=byJob.get(row.job.id)??row.job.createdByUserId;
   counts[userId]=(counts[userId]??0)+1;
 }
 return counts;
}
