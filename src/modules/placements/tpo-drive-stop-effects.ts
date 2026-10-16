import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
  activityEvents,collegeMemberships,inAppNotifications,placementApplications,
  placementApplicationStatusHistory,placementLearnerRequests,users,
} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
/**
 * TPO-requests-verification-07: an outstanding self-withdraw request cannot
 * remain pending when its drive is stopped. Reuse APPROVED (registered CHECK),
 * recording the legacy auto-approval consequence in the note/audit metadata.
 *
 * Caller holds the job row lock; the service does not mutate accepted offers.
 */
export async function settleDriveWithdrawalRequests(
  tx:Tx,ctx:RequestContext,jobId:string,collegeId:string,
  mode:"CLOSED"|"CANCELLED",reason:string,
) {
  const requests=await tx.select({
    id:placementLearnerRequests.id,
    applicationId:placementApplications.id,
    membershipId:placementApplications.membershipId,
    applicationStatus:placementApplications.status,
  }).from(placementLearnerRequests)
    .innerJoin(placementApplications,eq(
      placementApplications.id,placementLearnerRequests.applicationId))
    .where(and(eq(placementApplications.jobId,jobId),
      eq(placementLearnerRequests.requestType,"APPLICATION_WITHDRAWAL"),
      eq(placementLearnerRequests.status,"PENDING")))
    .for("update",{of:placementLearnerRequests});
  if(!requests.length)return 0;
  const now=new Date();
  let settled=0;
  const note="Approved (drive "+(mode==="CANCELLED"?"cancelled":"closed")+")";
  const distinctMemberships=new Set<string>();
  for(const entry of requests){
    const [saved]=await tx.update(placementLearnerRequests).set({
      status:"APPROVED",decidedByUserId:ctx.user.id,decidedAt:now,
      decisionNote:note,updatedAt:now,
    }).where(and(eq(placementLearnerRequests.id,entry.id),
      eq(placementLearnerRequests.status,"PENDING")))
      .returning({id:placementLearnerRequests.id});
    if(!saved)continue;
    if(entry.applicationStatus==="SUBMITTED"){
      const [withdrawn]=await tx.update(placementApplications).set({
        status:"WITHDRAWN",withdrawnAt:now,updatedAt:now,
      }).where(and(eq(placementApplications.id,entry.applicationId),
        eq(placementApplications.status,"SUBMITTED")))
        .returning({id:placementApplications.id});
      if(withdrawn)await tx.insert(placementApplicationStatusHistory).values({
        applicationId:withdrawn.id,fromStatus:"SUBMITTED",toStatus:"WITHDRAWN",
        actorUserId:ctx.user.id,reason:note,
      });
    }
    distinctMemberships.add(entry.membershipId);
    settled++;
  }
  const recipientRows=await tx.select({id:collegeMemberships.id,userId:users.id})
    .from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(eq(collegeMemberships.collegeId,collegeId),
      inArray(collegeMemberships.id,[...distinctMemberships])));
  const recipients=[...new Set(recipientRows.map(row=>row.userId))];
  const [event]=await tx.insert(activityEvents).values({
    organizationId:ctx.membership!.organizationId,
    collegeId,actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
    module:"PLACEMENTS",eventType:"DRIVE_REQUESTS_SETTLED",
    subjectType:"placement_job",subjectId:jobId,
    summary:note,metadata:{mode,reason,withdrawalsApproved:settled},
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("DRIVE_REQUEST_SETTLEMENT_AUDIT_FAILED");
  for(let i=0;i<recipients.length;i+=200){
    await tx.insert(inAppNotifications).values(recipients.slice(i,i+200).map(userId=>({
      userId,eventId:event.id,title:"Your request was answered",
      body:note+". "+reason,
      actionHref:"/learn/my-placements/placement",
    }))).onConflictDoNothing();
  }
  return settled;
}
