import "server-only";
import {and,asc,eq,gt,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,
 placementApplications,placementJobs,placementJobRoleOptions,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireTpoJobActor,requireTpoJobCollege} from "./tpo-job-write-base";
import {previewEligiblePublishedDrive} from "./tpo-drive-publish-effects";
import {placementJobIdSchema} from "./validation";
import {placementReminderCooldownCutoff,placementReminderDay,placementReminderPreviewToken,tpoRemindNotAppliedSchema}
 from "./tpo-remind-not-applied-model";


/** Documentation-only compatibility matrix; never invoke an old endpoint or
 * use client-supplied college/learner identity as an authorization shortcut.
 * Legacy numeric IDs require an explicit scoped mapping to vNext UUIDs.
 */
export const TPO_LEGACY_APPLICANT_ENDPOINT_CROSSWALK = [
 {old:"GET /applicants",new:"TPO applicants pipeline read service",method:"GET",success:200,
  scope:"TPO and job's persisted college",change:"UUID job/application IDs, server paging"},
 {old:"GET /not-applied",new:"GET /api/placements/tpo/jobs/[jobId]/remind-not-applied",method:"GET",success:200,
  scope:"TPO and published job college",change:"Eligible reminder preview count/token, not unrestricted student list"},
 {old:"POST /remind-not-applied",new:"POST /api/placements/tpo/jobs/[jobId]/remind-not-applied",method:"POST",success:200,
  scope:"TPO, same-origin, live job, active registered recipients",change:"Requires expectedPreviewToken; rolling 20h per drive; reminded/alreadySent"},
 {old:"POST /apply-on-behalf/{learnerId}",new:"Scoped drive-add workflow",method:"POST",success:201,
  scope:"TPO, writable college drive, learner membership",change:"No numeric learner override or unaudited direct add"},
 {old:"POST /add-students",new:"Scoped drive-add workflow",method:"POST",success:200,
  scope:"TPO, college/eligibility per learner",change:"Legacy includeIneligible/reason are not automatically trusted"},
 {old:"POST /bulk-move",new:"POST /api/placements/tpo/bulk-actions/preview then confirm",method:"POST",success:200,
  scope:"TPO, same-origin, matched applications, preview token",change:"No direct status write without preview/confirm"},
 {old:"POST /bulk-reject",new:"POST /api/placements/tpo/bulk-actions/preview then confirm",method:"POST",success:200,
  scope:"TPO, same-origin, matched applications, preview token",change:"Reason and state transition validated"},
 {old:"POST /undo/{undoGroupId}",new:"Undo workflow, if supported for selected group",method:"POST",success:200,
  scope:"TPO and original drive; deny notified/released groups",change:"Legacy 409 after student notification; no unverified alias"},
] as const;

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
 const [past]=await getDb().select({id:activityEvents.id}).from(activityEvents)
  .where(and(eq(activityEvents.subjectType,"placement_job"),
   eq(activityEvents.subjectId,job.id),
   eq(activityEvents.eventType,"PLACEMENTS_TPO_REMIND_NOT_APPLIED"),
   gt(activityEvents.createdAt,placementReminderCooldownCutoff(now)))).limit(1);
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
  // The job row lock serializes competing reminder requests on the same
  // drive. Recheck rolling cooldown INSIDE the transaction to cover 23:59
  // followed by 00:01 without sending a second notification.
  const [recent]=await tx.select({id:activityEvents.id}).from(activityEvents)
   .where(and(eq(activityEvents.subjectType,"placement_job"),
    eq(activityEvents.subjectId,job.id),
    eq(activityEvents.eventType,"PLACEMENTS_TPO_REMIND_NOT_APPLIED"),
    gt(activityEvents.createdAt,placementReminderCooldownCutoff(now)))).limit(1);
  if(recent)return {reminded:0,alreadySent:true,reason:"This drive was reminded within the past 20 hours."};
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
  if(!event)return {reminded:0,alreadySent:true,reason:"This drive was reminded within the past 20 hours."};
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


/** Separate, currently registered/eligible not-applied list. The vetted
 * recipient resolver already uses live placement registration and current
 * application exclusion; this reader reveals membership IDs only to a TPO
 * in the job's college, never to the reminder's notification audience. */
export async function listTpoEligibleNonApplicants(
 context:RequestContext,rawJobId:unknown,rawPage:unknown=1,
){
 const page=(await import("zod")).z.coerce.number().int().min(1).max(10000).parse(rawPage);
 const job=await scopedJob(context,rawJobId);
 const all=await getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  return candidateAudience(tx,context,job);
 },{accessMode:"read only"});
 const selectedUsers=all.slice((page-1)*25,page*25);
 const learners=selectedUsers.length?await getDb().select({
  membershipId:collegeMemberships.id,userId:collegeMemberships.userId,
  displayName:users.displayName,
 }).from(collegeMemberships)
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(eq(collegeMemberships.collegeId,job.collegeId),
  eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
  inArray(collegeMemberships.userId,selectedUsers)))
 .orderBy(asc(users.displayName),asc(collegeMemberships.id)):[];
 const roles=await getDb().select({
  id:placementJobRoleOptions.id,title:placementJobRoleOptions.title,
 }).from(placementJobRoleOptions).where(and(
  eq(placementJobRoleOptions.jobId,job.id),
  eq(placementJobRoleOptions.status,"ACTIVE")))
 .orderBy(asc(placementJobRoleOptions.title),asc(placementJobRoleOptions.id));
 return {jobId:job.id,jobTitle:job.title,
  students:learners,roles,page,total:all.length,hasMore:page*25<all.length,
  canAdd:job.status==="PUBLISHED"&&
   (!job.applicationDeadline||job.applicationDeadline>new Date()),
 };
}
