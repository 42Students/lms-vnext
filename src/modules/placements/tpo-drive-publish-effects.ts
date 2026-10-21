import "server-only";
import {and,eq,inArray,isNull} from "drizzle-orm";
import {
  collegeMemberships, inAppNotifications, learnerProgramEnrollments,
  membershipRoles, placementBatchRegistrations, placementCandidatePreferences,
  placementDebarmentDriveEvents, placementDebarments, users,
} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {getDb} from "@/db/client";
import {isDebarmentActive} from "./batch-registration-policy";
import {evaluatePlacementEligibility} from "./eligibility-service";
import {findUnchosenEligibleBatchStudents} from "./batch-participation-service";
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
export function collegeDate(now:Date){
  const values=new Intl.DateTimeFormat("en-US",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).formatToParts(now);
  const get=(key:string)=>values.find(row=>row.type===key)?.value??"";
  return get("year")+"-"+get("month")+"-"+get("day");
}
/**
 * Only a first publication consumes a debarment drive count. DB08 trigger
 * writes the irreversible counter/event and the pair uniqueness prevents retry duplication.
 */
export async function countPublishedDriveDebarments(
  tx:Tx,context:RequestContext,jobId:string,collegeId:string,now:Date,
){
  const bans=await tx.select().from(placementDebarments)
    .where(and(eq(placementDebarments.collegeId,collegeId),
      isNull(placementDebarments.liftedAt))).for("update");
  let affected=0;
  const today=collegeDate(now);
  for(const ban of bans){
    if(ban.untilDate!==null||ban.untilDrives===null||!isDebarmentActive(ban,today))continue;
    const inserted=await tx.insert(placementDebarmentDriveEvents).values({
      debarmentId:ban.id,jobId,recordedByUserId:context.user.id,
    }).onConflictDoNothing().returning({id:placementDebarmentDriveEvents.id});
    affected+=inserted.length;
  }
  return affected;
}
/**
 * Legacy targeting precedence was section/class then batch/cohort then program/department or all-college. In vNext the persisted college-scoped eligibility evaluation is authoritative. Unset audience never means public all-college reach.
 * Conservative eligible audience: active learner, explicit PLACEMENTS
 * registration, notification preference on, and job-specific eligibility.
 * NEVER count mere college membership as eligibility.
 */
export async function previewEligiblePublishedDrive(
  tx:Tx,context:RequestContext,job:{id:string;collegeId:string;title:string},
){
  const registrations=await tx.select({
    membershipId:collegeMemberships.id,userId:users.id,
    cohortId:placementBatchRegistrations.cohortId,
    notify:placementCandidatePreferences.notifyMatchingJobs,
  }).from(placementBatchRegistrations)
    .innerJoin(learnerProgramEnrollments,and(
      eq(learnerProgramEnrollments.cohortId,placementBatchRegistrations.cohortId),
      eq(learnerProgramEnrollments.membershipId,placementBatchRegistrations.membershipId),
      eq(learnerProgramEnrollments.status,"ACTIVE")))
    .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,placementBatchRegistrations.membershipId),
      eq(collegeMemberships.collegeId,job.collegeId),
      eq(collegeMemberships.status,"ACTIVE")))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER")))
    .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
      eq(users.platformStatus,"ACTIVE")))
    .leftJoin(placementCandidatePreferences,
      eq(placementCandidatePreferences.membershipId,collegeMemberships.id))
    .where(and(eq(placementBatchRegistrations.collegeId,job.collegeId),
      eq(placementBatchRegistrations.choice,"PLACEMENTS")));
  const enrolledCohorts=[...new Set(registrations.map(row=>row.cohortId))];
  const eligibleUsers=new Set<string>();
  for(const cohortId of enrolledCohorts){
    const allowed=await findUnchosenEligibleBatchStudents(
      tx,job.collegeId,cohortId,true,
    );
    for(const userId of allowed)eligibleUsers.add(userId);
  }
  const activeBans=registrations.length?await tx.select()
    .from(placementDebarments).where(and(
      eq(placementDebarments.collegeId,job.collegeId),
      isNull(placementDebarments.liftedAt),
      inArray(placementDebarments.membershipId,
        [...new Set(registrations.map(row=>row.membershipId))]),
    )):[];
  const barred=new Set(activeBans.filter(row=>isDebarmentActive(row,collegeDate(new Date())))
    .map(row=>row.membershipId));
  const recipients:string[]=[];
  for(const learner of registrations){
    if(learner.notify===false||!eligibleUsers.has(learner.userId)||
        barred.has(learner.membershipId))continue;
    const eligibility=await evaluatePlacementEligibility(
      context,job.id,learner.membershipId,tx,
    );
    if(eligibility.status==="ELIGIBLE")recipients.push(learner.userId);
  }
  const distinct=[...new Set(recipients)].sort();
  return {eligible:distinct.length,excluded:registrations.length-distinct.length,
    candidateCount:registrations.length,recipientUserIds:distinct};
}
export async function notifyEligiblePublishedDrive(
  tx:Tx,context:RequestContext,job:{id:string;collegeId:string;title:string},
  eventId:string,
){
  const result=await previewEligiblePublishedDrive(tx,context,job);
  const distinct=result.recipientUserIds;
  for(let i=0;i<distinct.length;i+=200){
    await tx.insert(inAppNotifications).values(
      distinct.slice(i,i+200).map(userId=>({
        userId,eventId,title:"New placement drive",
        body:job.title+" is open for applications. Review the details and deadline before applying.",
        actionHref:"/learn/my-placements/jobs/"+job.id,
      })),
    ).onConflictDoNothing();
  }
  return distinct.length;
}

/** Publish delivery policy choice for G2-3-023-021/-031. The legacy
 * operation defaulted to APP+EMAIL, but email transport is deliberately not
 * enabled until a permitted and audited adapter exists. Never claim that
 * EMAIL was delivered merely because an in-app row was written.
 * The lifecycle service rejects notifyByEmail=true before the DB write. */
export const TPO_PUBLISH_DELIVERY_POLICY = {
 allowedChannels:["APP"] as const,
 legacyDefaultChannels:["APP","EMAIL"] as const,
 emailAvailable:false,
 emailUnavailableCode:"EMAIL_DELIVERY_UNAVAILABLE",
 explanation:"Email notifications are not available. Eligible learners receive an in-app notice.",
} as const;

// Publishing is idempotent because notification writes conflict on their
// persisted (event, recipient) key. A retry must reuse its publication event
// ID; generating a fresh event constitutes a distinct authorized publish.
export function publishedDriveRecipientScopeDescription(){
 return "Eligible, opted-in learners with active PLACEMENTS registrations, tenant-scoped program enrolment and applicable job policy. No notification is sent to an unknown audience.";
}
