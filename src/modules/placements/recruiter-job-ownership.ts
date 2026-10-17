import "server-only";
import {and,eq,exists,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,placementRecruiterDriveRequests} from "@/db/schema";

/** REC-home-drives-R03: a company grant is NOT a grant to colleagues' drives.
 * Formal recruiter requests are owned by their submitter even when a TPO user
 * is recorded as the author of the resulting approved job.
 */
export function recruiterOwnJobPredicate(recruiterUserId:string){
 return or(
  eq(placementJobs.createdByUserId,recruiterUserId),
  exists(getDb().select({id:placementRecruiterDriveRequests.id})
   .from(placementRecruiterDriveRequests)
   .where(and(
    eq(placementRecruiterDriveRequests.recruiterUserId,recruiterUserId),
    eq(placementRecruiterDriveRequests.approvedJobId,placementJobs.id),
    eq(placementRecruiterDriveRequests.collegeId,placementJobs.collegeId),
    eq(placementRecruiterDriveRequests.companyRelationshipId,placementJobs.companyRelationshipId),
   ))),
 );
}

export async function recruiterOwnJobExists(recruiterUserId:string,jobId:string){
 const [row]=await getDb().select({id:placementJobs.id}).from(placementJobs)
  .where(and(eq(placementJobs.id,jobId),recruiterOwnJobPredicate(recruiterUserId))).limit(1);
 return Boolean(row);
}
