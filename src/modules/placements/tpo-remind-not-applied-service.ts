import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,
 placementApplications,placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireTpoJobActor,requireTpoJobCollege} from "./tpo-job-write-base";
import {previewEligiblePublishedDrive} from "./tpo-drive-publish-effects";
import {placementJobIdSchema} from "./validation";
import {placementReminderDay,placementReminderPreviewToken,tpoRemindNotAppliedSchema}
 from "./tpo-remind-not-applied-model";

type Db=ReturnType<typeof getDb>;
type Tx=Parameters<Parameters<Db["transaction"]>[0]>[0];

async function candidateAudience(tx:Tx,context:RequestContext,job:{
 id:string;title:string;collegeId:string;
}){
 const eligible=await previewEligiblePublishedDrive(tx,context,job);
 if(!eligible.recipientUserIds.length)return [];
 const alreadyApplied=await tx.select({userId:collegeMemberships.userId})
  .from(placementApplications)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .where(and(eq(placementApplications.jobId,job.id),
   eq(collegeMemberships.collegeId,job.collegeId),
   inArray(collegeMemberships.userId,eligible.recipientUserIds)));
 const existing=new Set(alreadyApplied.map(r=>r.userId));
 return eligible.recipientUserIds.filter(id=>!existing.has(id));
}
async function scopedJob(context:RequestContext,rawJobId:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const [job]=await getDb().select({
  id:placementJobs.id,title:placementJobs.title,collegeId:placementJobs.collegeId,
  status:placementJobs.status,applicationDeadline:placementJobs.applicationDeadline,
 }).from(placementJobs).where(and(eq(placementJobs.id,jobId),
  eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 return job;
}
function ensureLive(job:{status:string;applicationDeadline:Date|null},now:Date){
 if(job.status!=="PUBLISHED")throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
 if(job.applicationDeadline&&job.applicationDeadline<=now)
  throw new PlacementsServiceError("PLACEMENT_APPLICATION_DEADLINE_PASSED");
}
export async function getTpoNonApplicantReminderPreview(context:RequestContext,rawJobId:unknown){
 const job=await scopedJob(context,rawJobId),now=new Date();
 const day=placementReminderDay(now);
 const key="placement-non-applicant-reminder:"+job.id+":"+day;
 const [past]=await getDb().select({id:activityEvents.id}).from(activityEvents)
  .where(eq(activityEvents.dedupeKey,key)).limit(1);
 const allowed=job.status==="PUBLISHED"&&(!job.applicationDeadline||job.applicationDeadline>now);
 if(!allowed)return {jobId:job.id,day,count:0,allowed:false,alreadySent:Boolean(past),
  previewToken:null,reason:job.status!=="PUBLISHED"?"Drive is not published":"Application deadline has passed"};
 const recipients=await getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  return candidateAudience(tx,context,job);
 },{accessMode:"read only"});
 return {jobId:job.id,day,count:recipients.length,allowed:true,alreadySent:Boolean(past),
  previewToken:placementReminderPreviewToken(job.id,day,recipients),reason:null};
}
export async function remindTpoNonApplicants(context:RequestContext,rawJobId:unknown,raw:unknown){
 const input=tpoRemindNotAppliedSchema.parse(raw),job=await scopedJob(context,rawJobId);
 const now=new Date(),day=placementReminderDay(now);
 return getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  const [locked]=await tx.select({
   status:placementJobs.status,applicationDeadline:placementJobs.applicationDeadline,
  }).from(placementJobs).where(eq(placementJobs.id,job.id)).for("update").limit(1);
  if(!locked)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  ensureLive(locked,now);
  const recipients=await candidateAudience(tx,context,job);
  if(placementReminderPreviewToken(job.id,day,recipients)!==input.expectedPreviewToken)
   throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
  if(!recipients.length)return {reminded:0,alreadySent:false,reason:"No registered eligible students are awaiting an application."};
  const [event]=await tx.insert(activityEvents).values({
   organizationId:context.membership!.organizationId,collegeId:job.collegeId,
   actorUserId:context.user.id,actorMembershipId:context.membership!.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_TPO_REMIND_NOT_APPLIED",
   subjectType:"placement_job",subjectId:job.id,
   summary:"TPO reminded eligible registered students who have not applied",
   metadata:{jobId:job.id,recipientCount:recipients.length,day},
   dedupeKey:"placement-non-applicant-reminder:"+job.id+":"+day,
  }).onConflictDoNothing().returning({id:activityEvents.id});
  if(!event)return {reminded:0,alreadySent:true,reason:"This drive has already been reminded today."};
  for(let i=0;i<recipients.length;i+=100){
   await tx.insert(inAppNotifications).values(recipients.slice(i,i+100).map(userId=>({
    userId,eventId:event.id,title:"Placement application reminder",
    body:"You are eligible for "+job.title+" but have not applied. Review the drive before the application deadline.",
    actionHref:"/learn/my-placements/jobs/"+job.id,
   }))).onConflictDoNothing();
  }
  return {reminded:recipients.length,alreadySent:false,reason:null};
 });
}
