import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementRecruiterDriveRequests} from "@/db/schema/placement-drive-requests";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

type JobItem={job:{id:string;createdByUserId:string};collegeId:string;relationshipId:string};
type ApprovedAttribution={userId:string;jobId:string|null;status?:string};

/** Accurate caption for the scoped, authorized job-attribution count. */
export const RECRUITER_TEAM_DRIVE_COUNT_LABEL="Visible published or closed drives attributed here";

/** Count each authorized job only once. A duplicate or conflicting approval
 * record cannot arbitrarily credit a colleague: fall back to the persisted
 * job creator until an authoritative single attribution can be established.
 * This projection never grants access to a job. */
export function attributeRecruiterTeamJobs(
 authorizedJobs:readonly JobItem[],requests:readonly ApprovedAttribution[]
):Record<string,number>{
 const jobs=new Map<string,JobItem>();
 for(const row of authorizedJobs)if(!jobs.has(row.job.id))jobs.set(row.job.id,row);
 const approved=new Map<string,string|null>();
 for(const request of requests){
  if((request.status!==undefined&&request.status!=="DRAFT")||!request.jobId||!jobs.has(request.jobId))continue;
  if(!approved.has(request.jobId))approved.set(request.jobId,request.userId);
  else if(approved.get(request.jobId)!==request.userId)approved.set(request.jobId,null);
 }
 const counts:Record<string,number>={};
 for(const [id,row] of jobs){
  const userId=approved.get(id)??row.job.createdByUserId;
  counts[userId]=(counts[userId]??0)+1;
 }
 return counts;
}

/** Creator or approved request attribution, never an ownership permission grant.
 * Team totals cannot expose unpublished drives or another employer/college. */
export async function recruiterTeamAttributedDriveCounts(context:RequestContext,
 collegeId:string,relationshipId:string,authorizedJobs:readonly JobItem[]){
 if(context.recruiter?.status!=="ACTIVE"||context.recruiter.userId!==context.user.id)
  throw new AuthorizationError("placements.recruiter.read");
 const grant=context.recruiter.grants.find(g=>
   g.collegeId===collegeId&&g.companyRelationshipId===relationshipId);
 if(!grant)throw new AuthorizationError("placements.recruiter.read");
 requirePermission(context,"placements.recruiter.read",{collegeId,placementCompanyRelationshipId:relationshipId});
 const selected=authorizedJobs.filter(row=>
   row.collegeId===collegeId&&row.relationshipId===relationshipId);
 const ids=[...new Set(selected.map(row=>row.job.id))];
 if(!ids.length)return {} as Record<string,number>;
 const requests=await getDb().select({
  userId:placementRecruiterDriveRequests.recruiterUserId,
  jobId:placementRecruiterDriveRequests.approvedJobId,
  status:placementRecruiterDriveRequests.status,
 }).from(placementRecruiterDriveRequests).where(and(
   eq(placementRecruiterDriveRequests.collegeId,collegeId),
   eq(placementRecruiterDriveRequests.companyRelationshipId,relationshipId),
   eq(placementRecruiterDriveRequests.status,"DRAFT"),
   inArray(placementRecruiterDriveRequests.approvedJobId,ids),
 ));
 return attributeRecruiterTeamJobs(selected,requests);
}
