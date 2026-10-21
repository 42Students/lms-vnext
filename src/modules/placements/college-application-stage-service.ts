import "server-only";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,placementApplications,
 placementApplicationScreenings,placementApplicationScreeningHistory,
 placementJoiningOutcomes,placementJobs,placementOffers,users} from "@/db/schema";
import {placementCollegeApplicationStages,placementCollegeApplicationStageHistory}
 from "@/db/schema/placement-college-application-stages";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
import {listCollegeDriveApplications} from "./college-drive-applications-service";
import {DRIVE_APPLICATION_BULK_CAP} from "./college-drive-applications-model";
import {collegeDriveIdSchema} from "./college-drive-read-model";
import {collegeStageCommandSchema,COLLEGE_APPLICATION_TRANSITIONS,COLLEGE_APPLICATION_CORRECTIONS} from "./college-stage-action-model";
import {PlacementsServiceError} from "./errors";

export async function getCollegeApplicationPipeline(context:RequestContext,rawJobId:unknown,raw:unknown){
 const collegeId=await requireCollegePlacementAdmin(context),jobId=collegeDriveIdSchema.parse(rawJobId);
 const data=await listCollegeDriveApplications(context,jobId,raw);
 const storageReady=true;
 const stageRows=data.items.length?await getDb()
  .select({stage:placementCollegeApplicationStages,
   movedByName:users.displayName})
  .from(placementCollegeApplicationStages)
  .leftJoin(users,eq(users.id,placementCollegeApplicationStages.movedByUserId))
  .where(and(eq(placementCollegeApplicationStages.jobId,jobId),
   inArray(placementCollegeApplicationStages.applicationId,data.items.map(x=>x.id)))):[];
 const stages=new Map(stageRows.map(x=>[x.stage.applicationId,x]));
 return {...data,collegeId,storageReady,items:data.items.map(row=>{
  const state=stages.get(row.id);
  // Withdrawal trumps mutable pipeline projections and is never moveable.
  const effectiveStage=row.status==="WITHDRAWN"?"WITHDRAWN":
   state?.stage.stage??row.stage;
  const statusUpdatedAt=state?.stage.movedAt.toISOString()??null;
  const effectiveAgeDate=state?.stage.movedAt??new Date(row.submittedAt);
  const ageDays=Number.isFinite(effectiveAgeDate.getTime())
   ?Math.max(0,Math.floor((Date.now()-effectiveAgeDate.getTime())/86400000)):0;
  return {...row,ageDays,statusUpdatedAt,
   stage:effectiveStage,
   previousStage:state?.stage.previousStage??null,
   stageVersion:state?.stage.version??null,
   stageMovedByName:state?.movedByName??null,
   stageMovedAt:state?.stage.movedAt.toISOString()??null,
   allowedNextStages:row.status==="WITHDRAWN"?[]:
    [...(COLLEGE_APPLICATION_TRANSITIONS[effectiveStage]??[])],
   canReinstate:row.status==="SUBMITTED"&&effectiveStage==="REJECTED",
  };
 })};
}
export async function mutateCollegeApplicationStages(context:RequestContext,rawJobId:unknown,raw:unknown){
 const acting=await resolveActingCollege(context,"placements.manage");
 const collegeId=await requireCollegePlacementAdmin(context),jobId=collegeDriveIdSchema.parse(rawJobId);
 const input=collegeStageCommandSchema.parse(raw);
 if(input.notifyByEmail)throw Error("Email delivery is not registered for College Admin pipeline moves. Choose in-app notifications.");
 let applicationIds=input.applicationIds;
 if(input.matchingFilter){
  const matching=await listCollegeDriveApplications(context,jobId,
   {...input.matchingFilter,page:1},{bulkAll:true});
  if(matching.total>DRIVE_APPLICATION_BULK_CAP)
   throw Error("More than 3,000 applications match this filter. Narrow your filters.");
  applicationIds=matching.items.map(row=>row.id);
  if(applicationIds.length===0)throw Error("No matching applications to update.");
 }
 const results:Array<{applicationId:string;status:"moved"|"skipped";reason?:string;stage?:string}>=[];
 // A bounded read is followed by per-row transactions; each failure is explicit.
 for(const applicationId of applicationIds){
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
    if(input.action==="REINSTATE"&&from!=="REJECTED")
     throw Error("Only a rejected application can be reinstated.");
    // Restore the last genuine pre-rejection stage. Treat a legacy application
    // with no stage history as APPLIED (not a fabricated interview or offer).
    // Never restore a recorded previous REJECTED/WITHDRAWN stage.
    const prior=old?.previousStage;
    if(input.action==="REINSTATE"&&prior&&
       !(COLLEGE_APPLICATION_TRANSITIONS[prior]??[]).includes("REJECTED"))
     throw Error("The previous stage cannot be restored. Review stage history.");
    const next=input.action==="REINSTATE"?(prior??"APPLIED"):input.stage!;
    if(next===from)throw Error("Application is already in the selected stage.");
    if(input.action==="MOVE" && !(COLLEGE_APPLICATION_TRANSITIONS[from]??[]).includes(next)){
     const allowed=COLLEGE_APPLICATION_TRANSITIONS[from]??[];
     throw Error("Cannot move from "+from+" to "+next+
      ". Allowed next stages: "+(allowed.length?allowed.join(", "):"none")+".");
    }
    if(input.action==="CORRECT"){
     if(!(COLLEGE_APPLICATION_CORRECTIONS[from]??[]).includes(next))
      throw Error("That exceptional correction is not permitted for this stage.");
     if(next==="APPLIED"||next==="ASSESSMENT"){
      const live=await tx.select({id:placementOffers.id}).from(placementOffers)
       .where(and(eq(placementOffers.applicationId,applicationId),
        inArray(placementOffers.status,["ISSUED","ACCEPTED"]))).limit(1);
      if(live.length)throw Error("Resolve active offers before correcting a placement stage.");
     }
    }
    // Reversals are permitted by the old LMS, but an accepted offer or a
    // confirmed joining cannot be made to disappear by moving a display stage.
    // Real offer cancellation and joining corrections happen in their own
    // audited workflows before this pipeline is changed.
    if(from==="OFFERED"&&next==="INTERVIEW"){
     const live=await tx.select({id:placementOffers.id}).from(placementOffers)
      .where(and(eq(placementOffers.applicationId,applicationId),
       inArray(placementOffers.status,["ISSUED","ACCEPTED"]))).limit(1);
     if(live.length)throw Error("Withdraw or resolve active offers before moving back to Interview.");
    }
    if(from==="HIRED"&&next==="OFFERED"){
     const joined=await tx.select({id:placementJoiningOutcomes.offerId})
      .from(placementJoiningOutcomes).innerJoin(placementOffers,
       eq(placementOffers.id,placementJoiningOutcomes.offerId))
      .where(and(eq(placementOffers.applicationId,applicationId),
       eq(placementJoiningOutcomes.status,"JOINED"))).limit(1);
     if(joined.length)throw Error("Correct the joined outcome before moving back to Offered.");
    }
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
    if(next==="REJECTED"){
     const live=await tx.select({id:placementOffers.id}).from(placementOffers)
      .where(and(eq(placementOffers.applicationId,applicationId),
       inArray(placementOffers.status,["ISSUED","ACCEPTED"]))).limit(1);
     if(live.length)throw Error("Resolve active offers before rejecting this application.");
    }
    let screeningStatus=screening.status;
    if(input.action==="REINSTATE"){
     if(screeningStatus!=="REJECTED")
      throw Error("Reinstatement requires a rejected screening.");
     const openOffers=await tx.select({status:placementOffers.status})
      .from(placementOffers).where(and(eq(placementOffers.applicationId,applicationId),
       inArray(placementOffers.status,["ISSUED","ACCEPTED"]))).limit(1);
     if(openOffers.length)throw Error("Resolve active offers before reinstatement.");
     // REJECTED -> PENDING is permitted only after the proposed history
     // constraint migration is registered. Otherwise SQL rolls back.
     await tx.update(placementApplicationScreenings).set({
      status:"PENDING",candidateMessage:null,internalReason:null,
      decidedByUserId:null,decidedAt:null,updatedAt:new Date(),
     }).where(and(eq(placementApplicationScreenings.applicationId,applicationId),
      eq(placementApplicationScreenings.status,"REJECTED")));
     await tx.insert(placementApplicationScreeningHistory).values({
      applicationId,fromStatus:"REJECTED",toStatus:"PENDING",
      internalReason:input.reason,candidateMessage:null,actorUserId:context.user.id,
     });
     screeningStatus="PENDING";
     if(next!=="APPLIED"){
      // Interview/assessment/waitlist states still require a valid shortlisted
      // screening decision after restoration, never a lingering REJECTED flag.
      await tx.update(placementApplicationScreenings).set({
       status:"SHORTLISTED",candidateMessage:null,internalReason:input.reason,
       decidedByUserId:context.user.id,decidedAt:new Date(),updatedAt:new Date(),
      }).where(and(eq(placementApplicationScreenings.applicationId,applicationId),
       eq(placementApplicationScreenings.status,"PENDING")));
      await tx.insert(placementApplicationScreeningHistory).values({
       applicationId,fromStatus:"PENDING",toStatus:"SHORTLISTED",
       internalReason:input.reason,candidateMessage:null,actorUserId:context.user.id,
      });
      screeningStatus="SHORTLISTED";
     }
    }
    // 0125 registers REJECTED → PENDING and optional PENDING → SHORTLISTED history.
    const target=input.action==="REINSTATE"?null:
     next==="SHORTLISTED"?"SHORTLISTED":next==="REJECTED"?"REJECTED":null;
    if(target&&screeningStatus!==target){
     // COL-placements-01: a shortlisted application may be rejected later (Mark Failed).
     const allowed=((screeningStatus==="PENDING"||screeningStatus==="HOLD")&&
      (target==="SHORTLISTED"||target==="REJECTED"))||
      (screeningStatus==="SHORTLISTED"&&target==="REJECTED");
     if(!allowed)throw Error("The screening decision cannot be changed from its current state.");
     await tx.update(placementApplicationScreenings).set({
      status:target,decidedAt:new Date(),decidedByUserId:context.user.id,
      // Internal staff reason is never disclosed to a learner.
      candidateMessage:target==="REJECTED"?"Your application was not selected.":null,
      internalReason:input.reason,
      updatedAt:new Date(),
     }).where(eq(placementApplicationScreenings.applicationId,applicationId));
     await tx.insert(placementApplicationScreeningHistory).values({
      applicationId,fromStatus:screeningStatus,toStatus:target,
      candidateMessage:target==="REJECTED"?"Your application was not selected.":null,
      internalReason:input.reason,actorUserId:context.user.id,
     });
    }
    const [saved]=old?await tx.update(placementCollegeApplicationStages).set({
     stage:next,previousStage:from,version:old.version+1,
     reason:input.reason,movedByUserId:context.user.id,
     movedAt:new Date(),updatedAt:new Date(),
    }).where(and(eq(placementCollegeApplicationStages.id,old.id),
      eq(placementCollegeApplicationStages.version,old.version)))
     .returning({id:placementCollegeApplicationStages.id}):
     await tx.insert(placementCollegeApplicationStages).values({
      jobId,applicationId,stage:next,previousStage:from,reason:input.reason,
      movedByUserId:context.user.id,
     }).returning({id:placementCollegeApplicationStages.id});
    if(!saved)throw Error("Application stage changed. Reload the pipeline and try again.");
    await tx.insert(placementCollegeApplicationStageHistory).values({
     stageId:saved.id,fromStage:from,toStage:next,reason:input.reason,
     actorUserId:context.user.id,
    });
    const humanStage=next.replaceAll("_"," ").toLowerCase();
    const readableStage=humanStage[0]?.toUpperCase()+humanStage.slice(1);
    const [audit]=await tx.insert(activityEvents).values({
     organizationId:acting.organizationId,collegeId,
     actorUserId:context.user.id,actorMembershipId:context.membership?.collegeId===collegeId?context.membership.id:null,
     module:"PLACEMENTS",eventType:"PLACEMENTS_COLLEGE_APPLICATION_STAGE_MOVED",
     subjectType:"placement_application",subjectId:applicationId,
     summary:input.action==="CORRECT"?"College Admin corrected application stage to "+readableStage:
      input.action==="REINSTATE"?"College Admin reinstated application to "+readableStage:
      "College Admin moved application to "+readableStage,
     metadata:{jobId,from,to:next,reason:input.reason,
      exceptionalCorrection:input.action==="CORRECT"},
    }).returning({id:activityEvents.id});
    await tx.insert(inAppNotifications).values({
     userId:application.userId,eventId:audit.id,
     title:"Your placement application was updated",
     body:next==="REJECTED"?
      "Your application was not selected. See My applications for the latest status.":
      "Your placement stage is now "+readableStage+".",
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
