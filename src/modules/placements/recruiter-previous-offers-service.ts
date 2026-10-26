import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {listOwnRecruiterPlacementJobs} from "./recruiter-service";
import {getHrJobRead} from "./hr-job-read-service";
import {recruiterPreviousComparableJob,recruiterHistoricalOfferRows}
 from "./recruiter-previous-offers-model";

/** Reuses the exact persisted recruiter college/employer grant and shortlisted
 * applicant constraints already enforced for the current drive.
 * The previous job is selected from an authorized job list, then verified again
 * by the canonical read. Partial or broken history is never shown as zero. */
export async function getRecruiterPreviousHiringOffers(context:RequestContext,input:{
 jobId:string;collegeId:string;relationshipId:string;title:string;createdAt:Date;
}){
 const rows=await listOwnRecruiterPlacementJobs(context,input.collegeId,{limit:200});
 const previous=recruiterPreviousComparableJob(rows,{
  collegeId:input.collegeId,relationshipId:input.relationshipId,
  job:{id:input.jobId,title:input.title,createdAt:input.createdAt,
   status:"PUBLISHED",archivedAt:null},
 });
 if(!previous)return {status:"NONE" as const};
 const read=await getHrJobRead(context,previous.job.id,{
  tab:"offers",offerState:"ALL",offerPage:"1",
 });
 if(read.offersUnavailable)return {status:"UNAVAILABLE" as const};
 return {
  status:"READY" as const,
  jobId:previous.job.id,title:previous.job.title,
  year:previous.job.createdAt.getUTCFullYear(),
  rows:recruiterHistoricalOfferRows(read.offers),
  total:read.offersTotal,
  pageSize:read.offersPage.last,
 };
}
