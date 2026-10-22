import "server-only";
import {and,eq,gte,lt,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 activityEvents,collegeMemberships,colleges,inAppNotifications,membershipRoles,
 organizations,placementApplications,placementJobs,users,
} from "@/db/schema";
import {resolveRequestContext} from "@/modules/identity/context-service";
import {isSuperAdmin} from "@/modules/identity/context";
import {evaluatePlacementEligibilityBatch} from "@/modules/placements/eligibility-service";
import {generateDeadlineTodayEvents} from "@/modules/operations/tpo-reminder-source-events";
import type {ScheduledJobFence} from "@/modules/operations/scheduled-job-runner";

const MS_IST=330*60_000;
function indiaDayWindow(now:Date){
 if(!Number.isFinite(now.getTime()))throw new Error("TPO_DEADLINE_TIME_INVALID");
 const local=new Date(now.getTime()+MS_IST);
 const start=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-MS_IST;
 return {from:new Date(start),to:new Date(start+86_400_000),
  day:new Date(start+MS_IST).toISOString().slice(0,10),
  localHour:local.getUTCHours()};
}

/** A scheduled job never inherits a browser session or fabricates an admin.
 * Its explicit persisted service identity must hold an ACTIVE SUPER_ADMIN role.
 * Caller must also present the scheduler's private secret and lease; this
 * identity is used solely for the existing eligibility evaluator.
 */
async function jobEligibilityActor(){
 const identityUid=process.env["TPO_REMINDER_SYSTEM_IDENTITY_UID"]?.trim()??"";
 if(identityUid.length<16)throw new Error("TPO_REMINDER_ACTOR_NOT_CONFIGURED");
 const actor=await resolveRequestContext({identityUid});
 if(!isSuperAdmin(actor))throw new Error("TPO_REMINDER_ACTOR_NOT_AUTHORIZED");
 return actor;
}

/** The 08:00 IST application-deadline job. Read candidates only inside their
 * active college; apply the SAME job eligibility evaluator as TPO previews,
 * including program, cohort, section, evidence and INCLUDE/EXCLUDE rules.
 * Published jobs closing today are considered; any submitted/withdrawn
 * application blocks a second 'apply' nudge. Never send to generic staff.
 *
 * The caller owns a fenced tpo.deadlineToday lease. At most 200 new events
 * commit in one tick, and returning hasMore tells Cloud Scheduler to repeat
 * before the India-day window closes. No email is sent for this job.
 */
export async function queueEligibleDeadlineTodayReminders(
 fence:ScheduledJobFence,now=new Date(),
):Promise<{processed:number;hasMore:boolean;scannedJobs:number}>{
 if(fence.lease.jobName!=="tpo.deadlineToday")throw new Error("INVALID_TPO_REMINDER_LEASE");
 const window=indiaDayWindow(now);
 if(window.localHour<8)return {processed:0,hasMore:false,scannedJobs:0};
 await fence.assertCurrent();
 const actor=await jobEligibilityActor();
 const jobs=await getDb().select({
  id:placementJobs.id,title:placementJobs.title,collegeId:placementJobs.collegeId,
  deadlineAt:placementJobs.applicationDeadline,organizationId:colleges.organizationId,
 }).from(placementJobs)
  .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),eq(colleges.status,"ACTIVE")))
  .innerJoin(organizations,and(eq(organizations.id,colleges.organizationId),
    eq(organizations.status,"ACTIVE")))
  .where(and(eq(placementJobs.status,"PUBLISHED"),
    gte(placementJobs.applicationDeadline,window.from),
    lt(placementJobs.applicationDeadline,window.to)))
  .orderBy(placementJobs.id).limit(501);
 if(jobs.length>500)throw new Error("TPO_DEADLINE_JOB_BATCH_TOO_LARGE");
 let processed=0,scannedJobs=0,hasMore=false;
 for(const job of jobs){
  await fence.assertCurrent();
  scannedJobs++;
  const candidates=await getDb().selectDistinct({
   id:collegeMemberships.id,userId:collegeMemberships.userId,
  }).from(collegeMemberships)
   .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
    eq(users.platformStatus,"ACTIVE")))
   .where(and(eq(collegeMemberships.collegeId,job.collegeId),
    eq(collegeMemberships.status,"ACTIVE")))
   .orderBy(collegeMemberships.id).limit(10001);
  if(candidates.length>10000)throw new Error("TPO_DEADLINE_LEARNER_LIMIT");
  if(!candidates.length)continue;
  const ids=candidates.map(row=>row.id);
  const results=await evaluatePlacementEligibilityBatch({
   ...actor,adminScope:{organizationId:job.organizationId,collegeId:job.collegeId},
  },job.id,ids);
  const applications=await getDb().select({membershipId:placementApplications.membershipId})
   .from(placementApplications).where(eq(placementApplications.jobId,job.id));
  const applied=new Set(applications.map(row=>row.membershipId));
  const existing=await getDb().select({dedupeKey:activityEvents.dedupeKey})
   .from(activityEvents).where(and(
    eq(activityEvents.collegeId,job.collegeId),
    eq(activityEvents.eventType,"placements.deadline.today"),
    eq(activityEvents.subjectType,"placement_job"),
    eq(activityEvents.subjectId,job.id),
   ));
  const already=new Set(existing.map(row=>row.dedupeKey).filter(
   (value):value is string=>Boolean(value)));
  const eligible=ids.filter(id=>{
   const decision=results.get(id)?.status;
   const key="deadline-today:"+window.day+":"+job.id+":"+id;
   return (decision==="ELIGIBLE"||decision==="ELIGIBLE_WITH_MISSING_EVIDENCE")&&
    !applied.has(id)&&!already.has(key);
  });
  if(!eligible.length)continue;
  const slots=200-processed;
  if(slots<=0){hasMore=true;break;}
  const events=generateDeadlineTodayEvents([{
   jobId:job.id,collegeId:job.collegeId,published:true,deleted:false,
   deadlineAt:job.deadlineAt!,
   eligibleLearnerMembershipIds:eligible.slice(0,slots),
   appliedLearnerMembershipIds:[],
  }],now);
  await fence.assertCurrent();
  // Lease read and inbox insertion are in one transaction. A competing
  // worker cannot take over this fence until the transaction commits.
  const accepted=await getDb().transaction(async tx=>{
   const lease=await tx.execute<{job_name:string}>(sql`
    select job_name from scheduled_job_leases
    where job_name=${fence.lease.jobName}
      and locked_by=${fence.lease.holderId}
      and fence=${fence.lease.fence}
      and locked_until>clock_timestamp()
    for share
   `);
   if(!lease.rows[0])throw new Error("TPO_REMINDER_LEASE_LOST");
   const [live]=await tx.select({id:placementJobs.id,title:placementJobs.title})
    .from(placementJobs).where(and(
      eq(placementJobs.id,job.id),eq(placementJobs.status,"PUBLISHED"),
      gte(placementJobs.applicationDeadline,window.from),
      lt(placementJobs.applicationDeadline,window.to)))
    .for("share").limit(1);
   if(!live)return 0;
   let created=0;
   for(const event of events){
    if(event.type!=="DEADLINE_TODAY")continue;
    const [active]=await tx.select({userId:collegeMemberships.userId})
     .from(collegeMemberships).innerJoin(users,and(
       eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
     .innerJoin(membershipRoles,and(
       eq(membershipRoles.membershipId,collegeMemberships.id),
       eq(membershipRoles.role,"LEARNER")))
     .where(and(eq(collegeMemberships.id,event.membershipId),
       eq(collegeMemberships.collegeId,job.collegeId),
       eq(collegeMemberships.status,"ACTIVE"))).limit(1);
    if(!active)continue;
    const [application]=await tx.select({id:placementApplications.id})
     .from(placementApplications).where(and(
       eq(placementApplications.jobId,job.id),
       eq(placementApplications.membershipId,event.membershipId))).limit(1);
    if(application)continue;
    const [saved]=await tx.insert(activityEvents).values({
     collegeId:job.collegeId,organizationId:job.organizationId,
     actorUserId:actor.user.id,module:"PLACEMENTS",
     eventType:"placements.deadline.today",subjectType:"placement_job",
     subjectId:job.id,subjectLabel:live.title,
     summary:"Application deadline today",
     metadata:{jobId:job.id,learnerMembershipId:event.membershipId,
       indiaDate:window.day,deliveryChannel:"IN_APP"},
     dedupeKey:event.eventKey,
    }).onConflictDoNothing().returning({id:activityEvents.id});
    if(!saved)continue;
    await tx.insert(inAppNotifications).values({
     userId:active.userId,eventId:saved.id,
     title:"Application deadline today",
     body:"Applications for "+live.title.slice(0,200)+" close today.",
     actionHref:"/learn/placements",
     deliveryStatus:"SENT",deliveredAt:now,
    });
    created++;
   }
   return created;
  });
  processed+=accepted;
  if(eligible.length>slots){hasMore=true;break;}
 }
 return {processed,hasMore,scannedJobs};
}
