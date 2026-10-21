import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,placementApplications,placementCandidatePreferences,placementJobs,users} from "@/db/schema";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import {deliverInAppNotificationInTransaction} from "@/modules/activity/notification-service";
import {learnerPlacementEventCopy,learnerPlacementEventUsesMatchingJobsPreference,type LearnerPlacementEventKind} from "./learner-placement-event-copy";
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** Legacy JobNotificationHelper delivered asynchronously after commit.
 * Here the in-app receipt and source event are persisted atomically.
 * No provider sends occur in this transaction. External email/SMS need
 * separately authorized DB10 outbox entries with consent and approved DLT
 * templates. A queued intent is never described as sent.
 */
export const PLACEMENT_NOTICE_DELIVERY_POLICY = {
 inApp:"EVENT_TRANSACTION",external:"DB10_VERIFIED_OUTBOX",
 deduplication:"EVENT_ID_AND_RECIPIENT",crossCollege:"DENY",
} as const;

/** Operator-visible requirements, not proof of external dispatch. */
export function placementNoticeExternalChannelPlan(kind:LearnerPlacementEventKind){
 const email=["ROUND_SCHEDULED","ROUND_REMINDER","RESCHEDULE_DECIDED",
  "OFFER_RELEASED","OFFER_EXPIRING","OFFER_EXPIRED"].includes(kind);
 const sms=["APPLICATION_STATUS_CHANGED","ROUND_SCHEDULED","ROUND_REMINDER",
  "OFFER_RELEASED","OFFER_EXPIRING","OFFER_ACCEPTED_REPORTED",
  "MARKED_ABSENT","DRIVE_REMIND_NOT_APPLIED"].includes(kind);
 return {
  email:email?"REQUIRES_APPROVED_OUTBOX_AND_CONSENT":"NOT_REQUIRED",
  sms:sms?"REQUIRES_DLT_TEMPLATE_AND_CONSENT":"NOT_REQUIRED",
  dispatched:false,
 } as const;
}

/** Deterministically resolve the most recent BOOKED interview for an
 * application, never a cancelled/unassigned round or another applicant.
 * Call from the event writer if it only knows the application ID. */
export async function latestBookedPlacementInterviewInTransaction(
 tx:Tx,input:{collegeId:string;applicationId:string},
){
 const [row]=await tx.select({
  id:placementRoundCandidateSlots.id,
  roundId:placementRoundCandidateSlots.roundId,
  startsAt:placementRoundCandidateSlots.startsAt,
  room:placementRoundCandidateSlots.room,
 }).from(placementRoundCandidateSlots)
  .innerJoin(placementApplications,eq(placementApplications.id,placementRoundCandidateSlots.applicationId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .where(and(eq(placementRoundCandidateSlots.applicationId,input.applicationId),
   eq(placementRoundCandidateSlots.status,"BOOKED"),
   eq(placementRoundCandidateSlots.jobId,placementJobs.id),
   eq(placementJobs.collegeId,input.collegeId)))
  .orderBy(desc(placementRoundCandidateSlots.startsAt),desc(placementRoundCandidateSlots.id))
  .limit(1);
 return row??null;
}

export type LearnerPlacementDeliverySkip =
 "NO_ACTIVE_LEARNER"|"MEMBERSHIP_NOT_FOUND"|"ACCOUNT_INACTIVE"|
 "LEARNER_ROLE_REVOKED"|"JOB_NOT_FOUND_OR_OUTSIDE_COLLEGE"|"PREFERENCE_OFF";

/** LEARNER-placements-R04: call only from the original event transaction.
 * Revalidates active learner, college and user, honors the applicable saved
 * preference, and delegates event scope + duplicate protection to Activity.
 * Nothing is emitted by a page GET or a speculative schedule calculation. */
export async function deliverRecordedLearnerPlacementEvent(
 tx:Tx,
 input:{eventId:string;collegeId:string;membershipId:string;kind:LearnerPlacementEventKind;subject:string;jobId?:string;applicationId?:string},
):Promise<{delivered:boolean;skipped:LearnerPlacementDeliverySkip|null}>{
 if(input.jobId){
  const [job]=await tx.select({id:placementJobs.id}).from(placementJobs)
   .where(and(eq(placementJobs.id,input.jobId),eq(placementJobs.collegeId,input.collegeId)))
   .limit(1);
  if(!job)return {delivered:false,skipped:"JOB_NOT_FOUND_OR_OUTSIDE_COLLEGE"};
 }
 if(input.applicationId){
  const [application]=await tx.select({id:placementApplications.id})
   .from(placementApplications)
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .where(and(eq(placementApplications.id,input.applicationId),
    eq(placementApplications.membershipId,input.membershipId),
    eq(placementJobs.collegeId,input.collegeId),
    input.jobId?eq(placementJobs.id,input.jobId):undefined))
   .limit(1);
  if(!application)return {delivered:false,skipped:"JOB_NOT_FOUND_OR_OUTSIDE_COLLEGE"};
 }
 const [row]=await tx.select({
   userId:collegeMemberships.userId,
   matching:placementCandidatePreferences.notifyMatchingJobs,
   applications:placementCandidatePreferences.notifyApplicationUpdates,
  }).from(collegeMemberships)
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
  .leftJoin(placementCandidatePreferences,eq(placementCandidatePreferences.membershipId,collegeMemberships.id))
  .where(and(eq(collegeMemberships.id,input.membershipId),
    eq(collegeMemberships.collegeId,input.collegeId),eq(collegeMemberships.status,"ACTIVE")))
  .limit(1);
 if(!row){
  const [member]=await tx.select({
   id:collegeMemberships.id,userId:collegeMemberships.userId,
   status:collegeMemberships.status,
  }).from(collegeMemberships)
   .where(and(eq(collegeMemberships.id,input.membershipId),
    eq(collegeMemberships.collegeId,input.collegeId))).limit(1);
  if(!member)return {delivered:false,skipped:"MEMBERSHIP_NOT_FOUND"};
  if(member.status!=="ACTIVE")return {delivered:false,skipped:"NO_ACTIVE_LEARNER"};
  const [user]=await tx.select({status:users.platformStatus}).from(users)
   .where(eq(users.id,member.userId)).limit(1);
  if(!user||user.status!=="ACTIVE")return {delivered:false,skipped:"ACCOUNT_INACTIVE"};
  return {delivered:false,skipped:"LEARNER_ROLE_REVOKED"};
 }
 const enabled=learnerPlacementEventUsesMatchingJobsPreference(input.kind)
  ? row.matching!==false : row.applications!==false;
 if(!enabled)return {delivered:false,skipped:"PREFERENCE_OFF"};
 const message=learnerPlacementEventCopy(input.kind,input.subject);
 const delivered=await deliverInAppNotificationInTransaction(tx,input.eventId,[row.userId],message);
 return {delivered:delivered.delivered>0,skipped:null};
}

/** Notify saved participating learners for one drive, without a global
 * broadcast. Recipient selection and writes share the publisher transaction. */
export async function deliverRecordedJobApplicantsPlacementEvent(tx:Tx,input:{
 eventId:string;collegeId:string;jobId:string;
 kind:LearnerPlacementEventKind;subject:string;
}):Promise<number>{
 const [job]=await tx.select({id:placementJobs.id}).from(placementJobs)
  .where(and(eq(placementJobs.id,input.jobId),eq(placementJobs.collegeId,input.collegeId)))
  .limit(1);
 if(!job)return 0;
 const recipients=await tx.selectDistinct({
  userId:collegeMemberships.userId,
  matching:placementCandidatePreferences.notifyMatchingJobs,
  applications:placementCandidatePreferences.notifyApplicationUpdates,
 }).from(placementApplications)
  .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
    eq(placementJobs.collegeId,input.collegeId)))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
  .leftJoin(placementCandidatePreferences,eq(placementCandidatePreferences.membershipId,collegeMemberships.id))
  .where(and(eq(placementApplications.jobId,input.jobId),
   eq(collegeMemberships.collegeId,input.collegeId),eq(collegeMemberships.status,"ACTIVE")));
 const jobPreference=learnerPlacementEventUsesMatchingJobsPreference(input.kind);
 const usersToNotify=[...new Set(recipients.filter(row=>
   jobPreference?row.matching!==false:row.applications!==false).map(row=>row.userId))];
 const notice=learnerPlacementEventCopy(input.kind,input.subject);
 let delivered=0;
 for(let start=0;start<usersToNotify.length;start+=250){
  const result=await deliverInAppNotificationInTransaction(tx,input.eventId,
   usersToNotify.slice(start,start+250),notice);
  delivered+=result.delivered;
 }
 return delivered;
}
