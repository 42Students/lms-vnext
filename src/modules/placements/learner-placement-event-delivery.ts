import "server-only";
import {and,desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,learnerProfiles,placementApplications,placementCandidatePreferences,placementJobs,users} from "@/db/schema";
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
 inAppBatchSize:250,sourceReads:"EVENT_TRANSACTION_CURRENT",
} as const;

/** Producer, dispatcher, worker and idempotency closure for every learner
 * placement notice. Each producer calls the deliver functions below from the
 * transaction that writes its source activity event, so a status transition
 * and its in-app notice commit together (legacy JobNotificationHelper ran
 * after commit). External channels are never sent from these transactions. */
export const PLACEMENT_NOTICE_PRODUCER_CLOSURE = {
 producers:{
  applicationSubmittedResubmittedWithdrawn:"application-service.ts",
  collegePipelineMoves:"college-application-stage-service.ts",
  roundResultsAndAbsence:"result-service.ts",
  rescheduleRequests:"request-service.ts",
  offerReleaseAcceptReverse:"offer-service.ts",
  offerExpiry:"placement-offer-expiry-sweep-service.ts",
  driveDayAbsent:"tpo-drive-day-checkin-service.ts",
  driveBroadcasts:"job-service.ts",
 },
 dispatcher:"deliverInAppNotificationInTransaction",
 externalWorker:"operations/outbound-delivery-queue.ts (disabled unless DB10_OUTBOUND_READY)",
 idempotency:"EVENT_ID_AND_RECIPIENT",
 failurePolicy:"IN_APP_FAILURE_DOES_NOT_ROLL_BACK_MUTATION",
} as const;

const EXTERNAL_EMAIL_KINDS:readonly LearnerPlacementEventKind[]=
 ["ROUND_SCHEDULED","ROUND_REMINDER"];
const EXTERNAL_SMS_KINDS:readonly LearnerPlacementEventKind[]=
 ["APPLICATION_STATUS_CHANGED","ROUND_SCHEDULED","ROUND_REMINDER"];
/** Legacy TRAI SMS covered application confirmation, shortlisted, rejected,
 * interview scheduled/reminder/confirmed; other statuses were in-app only. */
const EXTERNAL_SMS_APPLICATION_STATUSES=["APPLIED","SHORTLISTED","REJECTED"];

/** Operator-visible requirements, not proof of external dispatch.
 * Narrowed urgent-email policy (NotificationEventRegistry.EMAIL_EVENTS:
 * interview scheduled/reminder/confirmed only) and the legacy SMS set
 * (TRAI_SMS_EVENTS). Everything else is deliberately in-app only; the
 * reason is returned so an operator can read why no external send exists. */
export function placementNoticeExternalChannelPlan(
 kind:LearnerPlacementEventKind,status?:string,
){
 const email=EXTERNAL_EMAIL_KINDS.includes(kind);
 const sms=EXTERNAL_SMS_KINDS.includes(kind)&&(kind!=="APPLICATION_STATUS_CHANGED"||
  (status!==undefined&&EXTERNAL_SMS_APPLICATION_STATUSES.includes(status.toUpperCase())));
 return {
  email:email?"REQUIRES_APPROVED_OUTBOX_AND_CONSENT":"NOT_REQUIRED",
  sms:sms?"REQUIRES_DLT_TEMPLATE_AND_CONSENT":"NOT_REQUIRED",
  skippedReason:email||sms?null:"IN_APP_ONLY_BY_POLICY",
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

/** Legacy JobNotificationHelper.isOptedOut: a learner who switched job
 * notifications off (profile jobNotificationsEnabled=false) or the granular
 * application-update preference gets no status notice. Used by direct
 * in-transaction writers (college pipeline moves) that do not go through
 * deliverRecordedLearnerPlacementEvent. No saved preference means notified. */
export async function learnerAcceptsPlacementApplicationNotices(
 tx:Tx,input:{collegeId:string;userId:string},
):Promise<boolean>{
 const [row]=await tx.select({
  applications:placementCandidatePreferences.notifyApplicationUpdates,
  profileEnabled:sql<boolean>`coalesce(${learnerProfiles.profileDocument}->'jobPreferences'->>'jobNotificationsEnabled','true') <> 'false'`,
 }).from(collegeMemberships)
  .leftJoin(placementCandidatePreferences,eq(placementCandidatePreferences.membershipId,collegeMemberships.id))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .where(and(eq(collegeMemberships.userId,input.userId),
   eq(collegeMemberships.collegeId,input.collegeId),eq(collegeMemberships.status,"ACTIVE")))
  .limit(1);
 if(!row)return true;
 return row.profileEnabled!==false&&row.applications!==false;
}

export type LearnerPlacementDeliverySkip =
 "NO_ACTIVE_LEARNER"|"MEMBERSHIP_NOT_FOUND"|"ACCOUNT_INACTIVE"|
 "LEARNER_ROLE_REVOKED"|"JOB_NOT_FOUND_OR_OUTSIDE_COLLEGE"|"PREFERENCE_OFF"|
 "DELIVERY_FAILED";

/** LEARNER-placements-R04: call only from the original event transaction.
 * Revalidates active learner, college and user, honors the applicable saved
 * preference, and delegates event scope + duplicate protection to Activity.
 * Nothing is emitted by a page GET or a speculative schedule calculation. */
export async function deliverRecordedLearnerPlacementEvent(
 tx:Tx,
 input:{eventId:string;collegeId:string;membershipId:string;kind:LearnerPlacementEventKind;
  subject:string;jobId?:string;applicationId?:string;
  /** Verified decision captured by the same transaction as the source event. */
  requestDecisionStatus?:"APPROVED"|"REJECTED"|undefined;requestDecisionNote?:string|undefined;
  /** Only a verified candidate-specific event writer can provide this. */
  approvedAssessmentUrl?:string},
):Promise<{delivered:boolean;skipped:LearnerPlacementDeliverySkip|null}>{
 let jobTitle:string|undefined;
 let scopedJobId:string|undefined=input.jobId;
 let applicationStatus:string|undefined;
 let applicationStatusUpdatedAt:Date|null=null;
 if(input.jobId){
  const [job]=await tx.select({id:placementJobs.id,title:placementJobs.title}).from(placementJobs)
   .where(and(eq(placementJobs.id,input.jobId),eq(placementJobs.collegeId,input.collegeId)))
   .limit(1);
  if(!job)return {delivered:false,skipped:"JOB_NOT_FOUND_OR_OUTSIDE_COLLEGE"};
  jobTitle=job.title;
 }
 if(input.applicationId){
  const [application]=await tx.select({
   id:placementApplications.id,jobId:placementJobs.id,jobTitle:placementJobs.title,
   status:placementApplications.status,statusUpdatedAt:placementApplications.statusUpdatedAt,
  })
   .from(placementApplications)
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .where(and(eq(placementApplications.id,input.applicationId),
    eq(placementApplications.membershipId,input.membershipId),
    eq(placementJobs.collegeId,input.collegeId),
    input.jobId?eq(placementJobs.id,input.jobId):undefined))
   .limit(1);
  if(!application)return {delivered:false,skipped:"JOB_NOT_FOUND_OR_OUTSIDE_COLLEGE"};
  scopedJobId=application.jobId;
  jobTitle=application.jobTitle;
  applicationStatusUpdatedAt=application.statusUpdatedAt;
  if(["INTERVIEW","OFFERED","HIRED","ASSESSMENT","REJECTED","SHORTLISTED","WAITLISTED"].includes(application.status))
   applicationStatus=application.status;
 }
 const [row]=await tx.select({
   userId:collegeMemberships.userId,
   matching:placementCandidatePreferences.notifyMatchingJobs,
   applications:placementCandidatePreferences.notifyApplicationUpdates,
   profileEnabled:sql<boolean>`coalesce(${learnerProfiles.profileDocument}->'jobPreferences'->>'jobNotificationsEnabled','true') <> 'false'`,
  }).from(collegeMemberships)
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
  .leftJoin(placementCandidatePreferences,eq(placementCandidatePreferences.membershipId,collegeMemberships.id))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
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
 // A legacy profile opt-out applies to every job/interview status event,
 // regardless of the newer granular placement preference toggles.
 const enabled=row.profileEnabled!==false && (
  learnerPlacementEventUsesMatchingJobsPreference(input.kind)
   ? row.matching!==false : row.applications!==false
 );
 if(!enabled)return {delivered:false,skipped:"PREFERENCE_OFF"};
 // Re-read the currently authorized job/application inside the event writer
 // transaction; context never comes from a browser-supplied college or URL.
 const rendered=learnerPlacementEventCopy(input.kind,input.subject,{
  jobId:scopedJobId,jobTitle,applicationId:input.applicationId,
  status:applicationStatus,statusUpdatedAt:applicationStatusUpdatedAt,
  assessmentUrl:input.applicationId?input.approvedAssessmentUrl:undefined,
  requestDecisionStatus:input.requestDecisionStatus,
  requestDecisionNote:input.requestDecisionNote,
 });
 // The strict delivery schema accepts only these three fields (no copy metadata).
 const message={title:rendered.title,body:rendered.body,actionHref:rendered.actionHref};
 // Legacy exceptions were logged and swallowed so a notice could never block
 // the status transition. A savepoint keeps that guarantee inside the shared
 // transaction: a failed notice write is undone alone and reported.
 try{
  const delivered=await tx.transaction(inner=>
   deliverInAppNotificationInTransaction(inner,input.eventId,[row.userId],message));
  return {delivered:delivered.delivered>0,skipped:null};
 }catch{
  return {delivered:false,skipped:"DELIVERY_FAILED"};
 }
}

/** Notify saved participating learners for one drive, without a global
 * broadcast. Recipient selection and writes share the publisher transaction. */
export async function deliverRecordedJobApplicantsPlacementEvent(tx:Tx,input:{
 eventId:string;collegeId:string;jobId:string;
 kind:LearnerPlacementEventKind;subject:string;
}):Promise<number>{
 const [job]=await tx.select({id:placementJobs.id,title:placementJobs.title}).from(placementJobs)
  .where(and(eq(placementJobs.id,input.jobId),eq(placementJobs.collegeId,input.collegeId)))
  .limit(1);
 if(!job)return 0;
 const recipients=await tx.selectDistinct({
  userId:collegeMemberships.userId,
  matching:placementCandidatePreferences.notifyMatchingJobs,
  applications:placementCandidatePreferences.notifyApplicationUpdates,
  profileEnabled:sql<boolean>`coalesce(${learnerProfiles.profileDocument}->'jobPreferences'->>'jobNotificationsEnabled','true') <> 'false'`,
 }).from(placementApplications)
  .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
    eq(placementJobs.collegeId,input.collegeId)))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
  .leftJoin(placementCandidatePreferences,eq(placementCandidatePreferences.membershipId,collegeMemberships.id))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .where(and(eq(placementApplications.jobId,input.jobId),
   eq(collegeMemberships.collegeId,input.collegeId),eq(collegeMemberships.status,"ACTIVE")));
 const jobPreference=learnerPlacementEventUsesMatchingJobsPreference(input.kind);
 const usersToNotify=[...new Set(recipients.filter(row=>
   row.profileEnabled!==false &&
   (jobPreference?row.matching!==false:row.applications!==false)).map(row=>row.userId))];
 // Broadcasts never carry candidate-specific assessment links. The job's
 // stored college is checked above and every recipient is revalidated.
 const notice=learnerPlacementEventCopy(input.kind,input.subject,{
  jobId:job.id,jobTitle:job.title,
 });
 let delivered=0;
 for(let start=0;start<usersToNotify.length;start+=PLACEMENT_NOTICE_DELIVERY_POLICY.inAppBatchSize){
  try{
   const result=await tx.transaction(inner=>deliverInAppNotificationInTransaction(inner,input.eventId,
    usersToNotify.slice(start,start+PLACEMENT_NOTICE_DELIVERY_POLICY.inAppBatchSize),{
     title:notice.title,body:notice.body,actionHref:notice.actionHref,
    }));
   delivered+=result.delivered;
  }catch{
   // Best effort per batch: a failed notice batch never rolls back the publish.
  }
 }
 return delivered;
}
