import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementApplications,placementJobs,placementOffers} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {closePlacementJob} from "./job-service";
import {reopenCollegeDrive} from "./college-drive-reopen-service";

export const collegeBulkDriveInput=z.strictObject({
 action:z.enum(["OPEN","CLOSE"]),
 jobIds:z.array(z.uuid()).min(1).max(25).refine(ids=>new Set(ids).size===ids.length,
  "Duplicate drive IDs are not allowed"),
 confirmed:z.literal(true),
});
export async function previewCollegeBulkDrives(ctx:RequestContext,raw:unknown){
 const input=collegeBulkDriveInput.omit({confirmed:true}).parse(raw);
 const collegeId=await requireCollegePlacementAdmin(ctx);
 const rows=await getDb().select({id:placementJobs.id,title:placementJobs.title,
  status:placementJobs.status}).from(placementJobs)
  .where(and(eq(placementJobs.collegeId,collegeId),inArray(placementJobs.id,input.jobIds)));
 const eligible=rows.filter(row=>input.action==="CLOSE"?row.status==="PUBLISHED":row.status==="CLOSED");
 const ignored=rows.filter(row=>!eligible.includes(row));
 const offers=eligible.length&&input.action==="CLOSE"?
  await getDb().select({jobId:placementApplications.jobId,id:placementOffers.id})
   .from(placementOffers).innerJoin(placementApplications,
     eq(placementApplications.id,placementOffers.applicationId))
   .where(and(inArray(placementApplications.jobId,eligible.map(row=>row.id)),
    eq(placementOffers.status,"ISSUED"))):[];
 return {requested:input.jobIds.length,eligible:eligible.length,ignored:ignored.length,
  excluded:input.jobIds.length-rows.length,
  pendingLettersWithdrawn:offers.length,rows};
}
/** Per-drive operations intentionally return partial failures, not false all-or-nothing claims. */
export async function updateCollegeBulkDrives(ctx:RequestContext,raw:unknown){
 const input=collegeBulkDriveInput.parse(raw);
 const preview=await previewCollegeBulkDrives(ctx,{
  action:input.action,jobIds:input.jobIds,
 });
 const allowed=new Set(preview.rows.filter(row=>
  input.action==="CLOSE"?row.status==="PUBLISHED":row.status==="CLOSED").map(row=>row.id));
 const results: {jobId:string;status:"UPDATED"|"SKIPPED";reason:string}[]=[];
 for(const jobId of input.jobIds){
  if(!allowed.has(jobId)){
   results.push({jobId,status:"SKIPPED",reason:"Drive unavailable or not in the required status"});continue;
  }
  try{
   if(input.action==="CLOSE")await closePlacementJob(ctx,jobId);
   else await reopenCollegeDrive(ctx,jobId,{confirmed:true});
   results.push({jobId,status:"UPDATED",reason:input.action==="CLOSE"?"Drive closed":"Drive opened"});
  }catch(error){results.push({jobId,status:"SKIPPED",
   reason:error instanceof Error?error.message:"Drive change failed"});}
 }
 return {updated:results.filter(r=>r.status==="UPDATED").length,
  skipped:results.filter(r=>r.status==="SKIPPED").length,results};
}
