import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,placementCandidatePreferences,users} from "@/db/schema";
import {deliverInAppNotificationInTransaction} from "@/modules/activity/notification-service";
import {learnerPlacementEventCopy,learnerPlacementEventUsesMatchingJobsPreference,type LearnerPlacementEventKind} from "./learner-placement-event-copy";
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** LEARNER-placements-R04: call only from the original event transaction.
 * Revalidates active learner, college and user, honors the applicable saved
 * preference, and delegates event scope + duplicate protection to Activity.
 * Nothing is emitted by a page GET or a speculative schedule calculation. */
export async function deliverRecordedLearnerPlacementEvent(
 tx:Tx,
 input:{eventId:string;collegeId:string;membershipId:string;kind:LearnerPlacementEventKind;subject:string},
):Promise<{delivered:boolean;skipped:"NO_ACTIVE_LEARNER"|"PREFERENCE_OFF"|null}>{
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
 if(!row)return {delivered:false,skipped:"NO_ACTIVE_LEARNER"};
 const enabled=learnerPlacementEventUsesMatchingJobsPreference(input.kind)
  ? row.matching!==false : row.applications!==false;
 if(!enabled)return {delivered:false,skipped:"PREFERENCE_OFF"};
 const message=learnerPlacementEventCopy(input.kind,input.subject);
 const delivered=await deliverInAppNotificationInTransaction(tx,input.eventId,[row.userId],message);
 return {delivered:delivered.delivered>0,skipped:null};
}
