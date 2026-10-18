import "server-only";
import {and,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementJobs,placementOffers} from "@/db/schema";
import {companyJobIdBatches} from "./company-job-id-batches";

/** Count only this college's explicit drive IDs; never infer zero from absent jobs. */
export async function getCompanyDriveCounts(collegeId:string,ids:readonly string[]){
 const counts=new Map<string,{applied:number;offers:number}>();
 if(!ids.length)return counts;
 const db=getDb();
 for(const id of ids)counts.set(id,{applied:0,offers:0});
 for(const jobBatch of companyJobIdBatches(ids)){
 const [applied,offers]=await Promise.all([
  db.select({jobId:placementApplications.jobId,
   total:sql<number>`count(distinct ${placementApplications.id})::integer`})
  .from(placementApplications)
  .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
   eq(placementJobs.collegeId,collegeId)))
  .where(and(inArray(placementApplications.jobId,jobBatch),
   eq(placementApplications.status,"SUBMITTED")))
  .groupBy(placementApplications.jobId),
  db.select({jobId:placementApplications.jobId,
   total:sql<number>`count(distinct ${placementOffers.applicationId})::integer`})
  .from(placementOffers).innerJoin(placementApplications,
   eq(placementApplications.id,placementOffers.applicationId))
  .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
   eq(placementJobs.collegeId,collegeId)))
  .where(and(inArray(placementApplications.jobId,jobBatch),
    eq(placementOffers.kind,"OFFER")))
  .groupBy(placementApplications.jobId),
 ]);
 for(const row of applied)counts.set(row.jobId,{...(counts.get(row.jobId)??{applied:0,offers:0}),
  applied:Number(row.total)});
 for(const row of offers)counts.set(row.jobId,{...(counts.get(row.jobId)??{applied:0,offers:0}),
  offers:Number(row.total)});
 }
 return counts;
}
