import "server-only";
import {and,asc,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {activityEvents,collegeMemberships,colleges,placementApplications,
 placementApplicationScreenings,placementJobRounds,placementJobs,users} from "@/db/schema";
import {placementTpoApplicationStages} from "@/db/schema/placement-tpo-application-stages";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoJobCollege,requireTpoJobActor} from "./tpo-job-write-base";
import {placementTableExists} from "./staged-tables";

export type TpoBulkStageAction="MOVE_TEST"|"MOVE_INTERVIEW";
export class TpoBulkStageError extends Error{
 constructor(readonly code:"STAGE_STORAGE_PENDING"|"STAGE_STALE"|"STAGE_NOT_ALLOWED"){
  super(code);this.name="TpoBulkStageError";
 }
}
type StageFact={version:string;ready:boolean;reason?:string};
const targetStage=(action:TpoBulkStageAction)=>action==="MOVE_TEST"?"TEST":"INTERVIEW";
const stageVersion=(row:{version:number;stage:string;roundId:string}|undefined)=>
 row?row.version+":"+row.stage+":"+row.roundId:"none";
const canAdvance=(current:string|null,to:"TEST"|"INTERVIEW")=>
 current===null||(current==="TEST"&&to==="INTERVIEW");

/** All facts are confined to the actor's persisted college and drive.
 * Missing storage yields an explicit fail-closed state, never a fake success. */
export async function loadTpoBulkApplicationStages(ctx:RequestContext,jobId:string,
 ids:readonly string[],action:TpoBulkStageAction):Promise<Map<string,StageFact>>{
 const collegeId=await requireTpoJobCollege(ctx);
 // This exported reader can be called without the bulk-preview controller.
 // Check the live actor, not only the membership roles in a stale cookie.
 await getDb().transaction(async tx=>requireTpoJobActor(tx,ctx));
 const result=new Map<string,StageFact>();
 if(!ids.length)return result;
 if(!await placementTableExists("placement_tpo_application_stages")){
  for(const id of ids)result.set(id,{version:"unavailable",ready:false,reason:"Applicant stage storage pending migration"});
  return result;
 }
 const db=getDb(),target=targetStage(action);
 const [rounds,applications,stages]=await Promise.all([
  db.select({id:placementJobRounds.id,kind:placementJobRounds.kind})
   .from(placementJobRounds).innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
   .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId),
    inArray(placementJobRounds.status,["SCHEDULED","COMPLETED"]),
    inArray(placementJobRounds.kind,target==="TEST"?["TEST","VENDOR_TEST"]:["INTERVIEW"])))
   .orderBy(asc(placementJobRounds.sequence),asc(placementJobRounds.id)).limit(1),
  db.select({id:placementApplications.id,status:placementApplications.status,
    jobStatus:placementJobs.status,screening:placementApplicationScreenings.status})
   .from(placementApplications).innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
      eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
   .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .where(and(eq(placementApplications.jobId,jobId),eq(placementJobs.collegeId,collegeId),
     inArray(placementApplications.id,[...ids]))),
  db.select({applicationId:placementTpoApplicationStages.applicationId,version:placementTpoApplicationStages.version,
   stage:placementTpoApplicationStages.stage,roundId:placementTpoApplicationStages.roundId})
   .from(placementTpoApplicationStages).where(and(eq(placementTpoApplicationStages.jobId,jobId),
     inArray(placementTpoApplicationStages.applicationId,[...ids]))),
 ]);
 const byApplication=new Map(stages.map(item=>[item.applicationId,item]));
 for(const app of applications){
  const stage=byApplication.get(app.id);
  const ready=app.status==="SUBMITTED"&&app.jobStatus==="PUBLISHED"&&app.screening==="SHORTLISTED"&&
   rounds.length>0&&canAdvance(stage?.stage??null,target);
  const reason=ready?undefined:!rounds.length?"No scheduled "+target.toLowerCase()+" round":
   app.screening!=="SHORTLISTED"?"Applicant must be shortlisted first":
   !canAdvance(stage?.stage??null,target)?"Already at or beyond this stage":
   "Application is not active";
  result.set(app.id,{version:stageVersion(stage),ready,reason});
 }
 return result;
}

/** Serialized per-application transition. The application lock prevents a
 * concurrent shortlist withdrawal and stage change from both succeeding. */
export async function moveTpoBulkApplicationStage(ctx:RequestContext,jobId:string,applicationId:string,
 action:TpoBulkStageAction,expectedVersion:string){
 const collegeId=await requireTpoJobCollege(ctx);
 if(!await placementTableExists("placement_tpo_application_stages"))
  throw new TpoBulkStageError("STAGE_STORAGE_PENDING");
 const target=targetStage(action);
 return getDb().transaction(async tx=>{
  // A revoked persisted TPO/CA role must be rejected in the SAME transaction
  // as the applicant change, even if its session cookie has not expired.
  await requireTpoJobActor(tx,ctx);
  const [app]=await tx.select({id:placementApplications.id,jobId:placementApplications.jobId,
   status:placementApplications.status,screening:placementApplicationScreenings.status})
   .from(placementApplications).innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
   .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
   .where(and(eq(placementApplications.id,applicationId),eq(placementApplications.jobId,jobId),
     eq(placementJobs.collegeId,collegeId),eq(placementJobs.status,"PUBLISHED")))
   .for("update",{of:placementApplications}).limit(1);
  if(!app||app.status!=="SUBMITTED"||app.screening!=="SHORTLISTED")
   throw new TpoBulkStageError("STAGE_NOT_ALLOWED");
  const [round]=await tx.select({id:placementJobRounds.id})
   .from(placementJobRounds).where(and(eq(placementJobRounds.jobId,jobId),
    inArray(placementJobRounds.status,["SCHEDULED","COMPLETED"]),
    inArray(placementJobRounds.kind,target==="TEST"?["TEST","VENDOR_TEST"]:["INTERVIEW"])))
   .orderBy(asc(placementJobRounds.sequence),asc(placementJobRounds.id)).limit(1);
  if(!round)throw new TpoBulkStageError("STAGE_NOT_ALLOWED");
  const [current]=await tx.select().from(placementTpoApplicationStages)
    .where(and(eq(placementTpoApplicationStages.applicationId,applicationId),
       eq(placementTpoApplicationStages.jobId,jobId))).for("update").limit(1);
  if(stageVersion(current)!==expectedVersion)throw new TpoBulkStageError("STAGE_STALE");
  if(!canAdvance(current?.stage??null,target))throw new TpoBulkStageError("STAGE_NOT_ALLOWED");
  const now=new Date();
  if(current){
   await tx.update(placementTpoApplicationStages).set({
    stage:target,roundId:round.id,version:sql`${placementTpoApplicationStages.version}+1`,
    changedByUserId:ctx.user.id,changedAt:now,
   }).where(eq(placementTpoApplicationStages.applicationId,applicationId));
  }else{
   await tx.insert(placementTpoApplicationStages).values({
    applicationId,jobId,roundId:round.id,stage:target,
    changedByUserId:ctx.user.id,changedAt:now,
   });
  }
  const [college]=await tx.select({organizationId:colleges.organizationId}).from(colleges)
   .where(eq(colleges.id,collegeId)).limit(1);
  await tx.insert(activityEvents).values({
   organizationId:college?.organizationId??ctx.membership!.organizationId,
   collegeId,actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
   module:"PLACEMENTS",eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_APPLICANT_STAGE_MOVED,
   subjectType:"placement_application",subjectId:applicationId,
   summary:"Placement cell moved applicant to "+target.toLowerCase(),
   metadata:{jobId,from:current?.stage??"SCREENING",to:target,roundId:round.id},
  });
  return {applicationId,stage:target,roundId:round.id};
 });
}
