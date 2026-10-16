import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,placementApplications,
 placementApplicationScreenings,placementApplicationScreeningHistory,
 placementJoiningOutcomes,placementJobs,placementOffers} from "@/db/schema";
import {placementCollegeApplicationStages,placementCollegeApplicationStageHistory}
 from "@/db/schema/placement-college-application-stages";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {listCollegeDriveApplications} from "./college-drive-applications-service";
import {collegeDriveIdSchema} from "./college-drive-read-model";
import {collegeStageCommandSchema} from "./college-stage-action-model";
import {PlacementsServiceError} from "./errors";

export async function getCollegeApplicationPipeline(context:RequestContext,rawJobId:unknown,raw:unknown){
 const collegeId=await requireCollegePlacementAdmin(context),jobId=collegeDriveIdSchema.parse(rawJobId);
 const data=await listCollegeDriveApplications(context,jobId,raw);
 const storageReady=true;
 const stageRows=data.items.length?await getDb().select().from(placementCollegeApplicationStages)
  .where(and(eq(placementCollegeApplicationStages.jobId,jobId),
   inArray(placementCollegeApplicationStages.applicationId,data.items.map(x=>x.id)))):[];
 const stages=new Map(stageRows.map(x=>[x.applicationId,x]));
 return {...data,collegeId,storageReady,items:data.items.map(row=>({
  ...row,stage:stages.get(row.id)?.stage??(row.screening==="SHORTLISTED"?"SHORTLISTED":
   row.screening==="REJECTED"?"REJECTED":"APPLIED"),
  previousStage:stages.get(row.id)?.previousStage??null,
  stageVersion:stages.get(row.id)?.version??null,
 }))};
}
export async function mutateCollegeApplicationStages(context:RequestContext,rawJobId:unknown,raw:unknown){
 const collegeId=await requireCollegePlacementAdmin(context),jobId=collegeDriveIdSchema.parse(rawJobId);
 const input=collegeStageCommandSchema.parse(raw);
 if(input.notifyByEmail)throw Error("Email delivery is not registered for College Admin pipeline moves. Choose in-app notifications.");
 const results:Array<{applicationId:string;status:"moved"|"skipped";reason?:string;stage?:string}>=[];
 // Batch deliberately reports each row; no successful row is represented as unprocessed on retry.
 for(const applicationId of input.applicationIds){
  try{
   const stage=await getDb().transaction(async tx=>{
    const [job]=await tx.select({id:placementJobs.id,status:placementJobs.status})
     .from(placementJobs).where(and(eq(placementJobs.id,jobId),
      eq(placementJobs.collegeId,collegeId))).for("share").limit(1);
    if(!job||["CLOSED","ARCHIVED","CANCELLED"].includes(job.status))
     throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
    const [application]=await tx.select({
     id:placementApplications.id,status:placementApplications.status,
     userId:collegeMemberships.userId,
    }).from(placementApplications)
     .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
     .where(and(eq(placementApplications.id,applicationId),
      eq(placementApplications.jobId,jobId),eq(collegeMemberships.collegeId,collegeId)))
     .for("update",{of:placementApplications}).limit(1);
    if(!application||application.status!=="SUBMITTED")
     throw new PlacementsServiceError("PLACEMENT_SCREENING_APPLICATION_INACTIVE");
    const [old]=await tx.select().from(placementCollegeApplicationStages)
     .where(and(eq(placementCollegeApplicationStages.jobId,jobId),
      eq(placementCollegeApplicationStages.applicationId,applicationId))).for("update").limit(1);
    const [screening]=await tx.select().from(placementApplicationScreenings)
     .where(eq(placementApplicationScreenings.applicationId,applicationId)).for("update").limit(1);
    if(!screening)throw new PlacementsServiceError("PLACEMENT_SCREENING_NOT_FOUND");
    const from=old?.stage??(screening.status==="SHORTLISTED"?"SHORTLISTED":
     screening.status==="REJECTED"?"REJECTED":"APPLIED");
    const next=input.action==="REINSTATE"?old?.previousStage??"APPLIED":input.stage!;
    if(input.action==="REINSTATE"&&from!=="REJECTED")
     throw Error("Only a rejected application can be reinstated.");
    if(next===from)return from;
    if(["OFFERED","HIRED"].includes(next)){
     const offers=await tx.select({
      status:placementOffers.status,joining:placementJoiningOutcomes.status,
     }).from(placementOffers).leftJoin(placementJoiningOutcomes,
      eq(placementJoiningOutcomes.offerId,placementOffers.id))
      .where(eq(placementOffers.applicationId,applicationId));
     if(next==="OFFERED"&&!offers.some(o=>o.status==="ISSUED"||o.status==="ACCEPTED"))
      throw Error("Issue an actual offer before moving this application to Offered.");
     if(next==="HIRED"&&!offers.some(o=>o.status==="ACCEPTED"&&o.joining==="JOINED"))
      throw Error("Confirm an accepted offer's joining outcome before marking Hired.");
    }
    // Keep underlying screening authoritative: do not fake a reinstate when its
    // immutable history constraint cannot represent REJECTED -> PENDING.
    if(input.action==="REINSTATE"&&screening.status==="REJECTED")
     throw Error("Screening reinstate needs the audited correction transition registered before continuing.");
    const target=next==="SHORTLISTED"?"SHORTLISTED":next==="REJECTED"?"REJECTED":null;
    if(target&&screening.status!==target){
     const allowed=(screening.status==="PENDING"||screening.status==="HOLD")&&
      (target==="SHORTLISTED"||target==="REJECTED");
     if(!allowed)throw Error("The screening decision cannot be changed from its current state.");
     await tx.update(placementApplicationScreenings).set({
      status:target,decidedAt:new Date(),decidedByUserId:context.user.id,
      candidateMessage:target==="REJECTED"?input.reason:null,internalReason:input.reason,
      updatedAt:new Date(),
     }).where(eq(placementApplicationScreenings.applicationId,applicationId));
     await tx.insert(placementApplicationScreeningHistory).values({
      applicationId,fromStatus:screening.status,toStatus:target,
      candidateMessage:target==="REJECTED"?input.reason:null,
      internalReason:input.reason,actorUserId:context.user.id,
     });
    }
    const [saved]=old?await tx.update(placementCollegeApplicationStages).set({
     stage:next,previousStage:from,version:old.version+1,
     reason:input.reason,movedByUserId:context.user.id,
     movedAt:new Date(),updatedAt:new Date(),
    }).where(eq(placementCollegeApplicationStages.id,old.id))
     .returning({id:placementCollegeApplicationStages.id}):
     await tx.insert(placementCollegeApplicationStages).values({
      jobId,applicationId,stage:next,previousStage:from,reason:input.reason,
      movedByUserId:context.user.id,
     }).returning({id:placementCollegeApplicationStages.id});
    await tx.insert(placementCollegeApplicationStageHistory).values({
     stageId:saved.id,fromStage:from,toStage:next,reason:input.reason,
     actorUserId:context.user.id,
    });
    const [audit]=await tx.insert(activityEvents).values({
     organizationId:context.membership!.organizationId,collegeId,
     actorUserId:context.user.id,actorMembershipId:context.membership!.id,
     module:"PLACEMENTS",eventType:"PLACEMENTS_COLLEGE_APPLICATION_STAGE_MOVED",
     subjectType:"placement_application",subjectId:applicationId,
     summary:"College Admin moved application to "+next,
     metadata:{jobId,from,to:next,reason:input.reason},
    }).returning({id:activityEvents.id});
    await tx.insert(inAppNotifications).values({
     userId:application.userId,eventId:audit.id,
     title:"Your placement application was updated",
     body:"Your placement stage is now "+next.toLowerCase().replaceAll("_"," ")+". "+input.reason,
     actionHref:"/learn/my-placements/applications",
    }).onConflictDoNothing();
    return next;
   });
   results.push({applicationId,status:"moved",stage});
  }catch(e){results.push({applicationId,status:"skipped",reason:e instanceof Error?e.message:"Move rejected"});}
 }
 return {moved:results.filter(r=>r.status==="moved").length,
  skipped:results.filter(r=>r.status==="skipped").length,results};
}
