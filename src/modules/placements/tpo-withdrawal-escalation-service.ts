import "server-only";
import {and,asc,eq,gt,lte,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,inAppNotifications,membershipRoles,
 placementApplications,placementJobRounds,placementJobs,placementLearnerRequests,users} from "@/db/schema";

/**
 * TPO-requests-verification-05: cron-safe, one-time escalation before the
 * next scheduled round. No read endpoint or user-facing GET performs writes.
 * activity_events.dedupe_key is a durable per-request idempotency guard.
 */
/** Every-fifteen-minutes scheduling with a twelve-minute nominal lease.
 * A process-local lease would be unsafe across replicas: the durable unique
 * activity event plus locked pending request is the cross-worker write guard.
 */
export const TPO_WITHDRAWAL_ESCALATION_SCHEDULE={
 intervalMinutes:15,leaseMinutes:12,windowHours:24,
 concurrency:"transaction-lock-and-deduped-event" as const,
};
/** Other daily TPO jobs use IST dates, never UTC-midnight dates.
 * Asia/Kolkata has a fixed UTC+05:30 civil offset for the current calendar. */
export function tpoIstCalendarDayWindow(now:Date):{from:Date;through:Date}{
 const ms=now.getTime();
 if(!Number.isFinite(ms))throw new Error("Invalid daily scheduler clock");
 const istOffset=330*60_000;
 const fromMs=Math.floor((ms+istOffset)/86400000)*86400000-istOffset;
 return {from:new Date(fromMs),through:new Date(fromMs+86400000)};
}
/** The scheduler clock is trusted only after validating it. The 24-hour
 * boundary includes the exact endpoint and never crosses via local timezone. */
export function tpoWithdrawalEscalationWindow(now:Date):{from:Date;through:Date}{
 const milliseconds=now.getTime();
 const until=milliseconds+24*60*60*1000;
 if(!Number.isFinite(milliseconds)||!Number.isFinite(until)||
   !Number.isFinite(new Date(until).getTime()))
   throw new Error("Invalid withdrawal escalation clock");
 return {from:new Date(milliseconds),through:new Date(until)};
}
export async function escalatePendingWithdrawalRequests(now:Date=new Date()){
 const {from,through:until}=tpoWithdrawalEscalationWindow(now);
 const db=getDb();
 const candidates=await db.select({
  requestId:placementLearnerRequests.id,
  applicationId:placementApplications.id,
  student:users.displayName,
  roundAt:placementJobRounds.scheduledAt,
  roundName:placementJobRounds.name,
  jobId:placementJobs.id,jobTitle:placementJobs.title,
  collegeId:placementJobs.collegeId,organizationId:colleges.organizationId,
 }).from(placementLearnerRequests)
  .innerJoin(placementApplications,eq(placementApplications.id,placementLearnerRequests.applicationId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(placementJobRounds,eq(placementJobRounds.jobId,placementJobs.id))
  .where(and(eq(placementLearnerRequests.requestType,"APPLICATION_WITHDRAWAL"),
   eq(placementLearnerRequests.status,"PENDING"),eq(placementApplications.status,"SUBMITTED"),
   eq(placementJobRounds.status,"SCHEDULED"),gt(placementJobRounds.scheduledAt,from),
   lte(placementJobRounds.scheduledAt,until),
   eq(collegeMemberships.collegeId,placementJobs.collegeId),
   eq(colleges.status,"ACTIVE")))
  .orderBy(asc(placementJobRounds.scheduledAt)).limit(4000);
 const earliest=new Map<string,(typeof candidates)[number]>();
 for(const row of candidates){if(!earliest.has(row.requestId))earliest.set(row.requestId,row);}
 let escalated=0,alreadyEscalated=0,noRecipients=0;
 const errors:Array<{requestId:string;reason:string}>=[];
 const audience=new Map<string,string[]>();
 for(const candidate of earliest.values()){
  try{
   let people=audience.get(candidate.collegeId);
   if(!people){
    const rows=await db.select({id:users.id}).from(collegeMemberships)
     .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
     .innerJoin(users,eq(users.id,collegeMemberships.userId))
     .where(and(eq(collegeMemberships.collegeId,candidate.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),eq(membershipRoles.role,"TPO"),
      eq(users.platformStatus,"ACTIVE")));
    people=[...new Set(rows.map(x=>x.id))];audience.set(candidate.collegeId,people);
   }
   if(!people.length){noRecipients++;continue;}
   const outcome=await db.transaction(async tx=>{
    const [locked]=await tx.select({id:placementLearnerRequests.id})
     .from(placementLearnerRequests).where(and(
      eq(placementLearnerRequests.id,candidate.requestId),
      eq(placementLearnerRequests.status,"PENDING"))).for("update").limit(1);
    if(!locked)return "decided";
    const [event]=await tx.insert(activityEvents).values({
     organizationId:candidate.organizationId,collegeId:candidate.collegeId,
     actorUserId:null,actorMembershipId:null,module:"PLACEMENTS",
     eventType:"PLACEMENTS_TPO_WITHDRAWAL_ESCALATED",
     subjectType:"placement_learner_request",subjectId:candidate.requestId,
     summary:"Withdrawal needs a decision before "+candidate.roundName+
      " for "+candidate.jobTitle,
     metadata:{requestId:candidate.requestId,applicationId:candidate.applicationId,
      jobId:candidate.jobId,roundAt:candidate.roundAt?.toISOString()},
     importance:"HIGH",dedupeKey:"tpo-withdrawal-escalation:"+candidate.requestId,
    }).onConflictDoNothing().returning({id:activityEvents.id});
    if(!event)return "already";
    for(let i=0;i<people.length;i+=100){
     await tx.insert(inAppNotifications).values(people.slice(i,i+100).map(userId=>({
      userId,eventId:event.id,title:"Decide "+(candidate.student??"the learner")+"'s withdrawal before the round",
      body:(candidate.student??"A learner")+" has requested withdrawal from "+candidate.jobTitle+
       ". The next round is within 24 hours. Decide the request.",
      actionHref:"/tpo/requests",
     }))).onConflictDoNothing();
    }
    return "escalated";
   });
   if(outcome==="escalated")escalated++;
   else if(outcome==="already")alreadyEscalated++;
  }catch{
   // Do not expose SQLSTATE, provider details, PII, or a stack in API results.
   errors.push({requestId:candidate.requestId,reason:"Escalation could not be completed. Retry later."});
  }
 }
 return {examined:earliest.size,escalated,alreadyEscalated,
  noRecipients,errors:errors.slice(0,100),truncated:candidates.length===4000};
}
