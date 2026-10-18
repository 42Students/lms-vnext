import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
  activityEvents,collegeMemberships,inAppNotifications,placementApplications,
  placementApplicationScreenings,placementApplicationScreeningHistory,placementOffers,
  placementApplicationStatusHistory,placementLearnerRequests,
  placementRecruiterDriveRequests,users,
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
  const accepted=await tx.select({applicationId:placementOffers.applicationId})
    .from(placementOffers).where(and(
      inArray(placementOffers.applicationId,requests.map(item=>item.applicationId)),
      eq(placementOffers.status,"ACCEPTED")));
  const acceptedIds=new Set(accepted.map(item=>item.applicationId));
  const now=new Date();
  let settled=0,approved=0,rejected=0;
  const statusLabel=mode==="CANCELLED"?"cancelled":"closed";
  const approvedNote="Approved (drive "+statusLabel+")";
  const rejectedNote="Rejected (drive "+statusLabel+"; accepted offer remains valid)";
  const distinctMemberships=new Set<string>();
  for(const entry of requests){
    // An accepted offer is an active commitment; do not mark its application
    // withdrawn without a separate, explicit offer-dispute decision.
    // A request associated with an accepted offer cannot remain pending
    // indefinitely after the drive stops. Reject the withdrawal, preserve
    // the commitment and retain the officer's reason.
    const protectedOffer=acceptedIds.has(entry.applicationId);
    const decision=protectedOffer?"REJECTED":"APPROVED";
    const note=protectedOffer?rejectedNote:approvedNote;
    const [saved]=await tx.update(placementLearnerRequests).set({
      status:decision,decidedByUserId:ctx.user.id,decidedAt:now,
      decisionNote:note,updatedAt:now,
    }).where(and(eq(placementLearnerRequests.id,entry.id),
      eq(placementLearnerRequests.status,"PENDING")))
      .returning({id:placementLearnerRequests.id});
    if(!saved)continue;
    if(!protectedOffer&&entry.applicationStatus==="SUBMITTED"){
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
    if(protectedOffer)rejected++;else approved++;
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
    summary:"Withdrawal requests reviewed after drive "+statusLabel,
    metadata:{mode,reason,withdrawalsApproved:approved,withdrawalsRejected:rejected},
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("DRIVE_REQUEST_SETTLEMENT_AUDIT_FAILED");
  for(let i=0;i<recipients.length;i+=200){
    await tx.insert(inAppNotifications).values(recipients.slice(i,i+200).map(userId=>({
      userId,eventId:event.id,title:"Your request was answered",
      body:"Your withdrawal request was reviewed after the drive ended. Check Requests for the decision. "+reason,
      actionHref:"/learn/my-placements/placement",
    }))).onConflictDoNothing();
  }
  return settled;
}

/**
 * End only unplaced applicants' open screening journeys. Accepted offers and
 * their applications are retained. History CHECK currently supports PENDING
 * and HOLD -> REJECTED; SHORTLISTED terminal state has a drive-level audit
 * event until its own history transition is registered.
 */
export async function endDriveApplicants(
  tx:Tx,ctx:RequestContext,jobId:string,collegeId:string,
  mode:"CLOSED"|"CANCELLED",reason:string,
){
  const rows=await tx.select({
    id:placementApplications.id,
    membershipId:placementApplications.membershipId,
    status:placementApplications.status,
    userId:users.id,
  }).from(placementApplications)
    .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,placementApplications.membershipId),
      eq(collegeMemberships.collegeId,collegeId)))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(eq(placementApplications.jobId,jobId));
  const accepted=await tx.select({applicationId:placementOffers.applicationId})
    .from(placementOffers).innerJoin(placementApplications,
      eq(placementApplications.id,placementOffers.applicationId))
    .where(and(eq(placementApplications.jobId,jobId),
      eq(placementOffers.status,"ACCEPTED")));
  const protectedIds=new Set(accepted.map(row=>row.applicationId));
  const visibleMessage=mode==="CANCELLED"?
    "This drive was cancelled. "+reason:
    "This drive has closed. You were not selected. "+reason;
  const timestamp=new Date();
  let rejected=0;
  for(const row of rows){
    if(row.status!=="SUBMITTED"||protectedIds.has(row.id))continue;
    const [old]=await tx.select({status:placementApplicationScreenings.status})
      .from(placementApplicationScreenings)
      .where(eq(placementApplicationScreenings.applicationId,row.id)).limit(1);
    if(old?.status==="REJECTED")continue;
    const [saved]=await tx.insert(placementApplicationScreenings).values({
      applicationId:row.id,status:"REJECTED",
      decidedByUserId:ctx.user.id,decidedAt:timestamp,
      candidateMessage:visibleMessage,
    }).onConflictDoUpdate({
      target:placementApplicationScreenings.applicationId,
      set:{status:"REJECTED",decidedByUserId:ctx.user.id,decidedAt:timestamp,
        candidateMessage:visibleMessage,updatedAt:timestamp},
    }).returning({id:placementApplicationScreenings.applicationId});
    if(!saved)throw new Error("PLACEMENT_APPLICATION_STOP_FAILED");
    if(!old||old.status==="PENDING"||old.status==="HOLD"){
      await tx.insert(placementApplicationScreeningHistory).values({
        applicationId:row.id,fromStatus:old?.status??"PENDING",toStatus:"REJECTED",
        actorUserId:ctx.user.id,candidateMessage:visibleMessage,
      });
    }
    rejected++;
  }
  const [event]=await tx.insert(activityEvents).values({
    organizationId:ctx.membership!.organizationId,collegeId,
    actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
    module:"PLACEMENTS",eventType:"DRIVE_APPLICANTS_ENDED",
    subjectType:"placement_job",subjectId:jobId,
    summary:mode==="CANCELLED"?"TPO cancelled a drive":"TPO closed a drive",
    metadata:{mode,reason,rejected,acceptedOffersRetained:accepted.length},
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("PLACEMENT_APPLICANT_STOP_AUDIT_FAILED");
  const recipients=new Map<string,{accepted:boolean;withdrawn:boolean}>();
  for(const row of rows){
    const previous=recipients.get(row.userId);
    recipients.set(row.userId,{accepted:Boolean(previous?.accepted)||protectedIds.has(row.id),
      withdrawn:Boolean(previous?.withdrawn)||row.status==="WITHDRAWN"});
  }
  const notices=[...recipients].map(([userId,state])=>({
    userId,eventId:event.id,
    title:mode==="CANCELLED"?"This drive was cancelled":"This drive has closed",
    body:state.accepted?
      (mode==="CANCELLED"?"This drive was cancelled. ":"This drive has closed. ")+
        "Your accepted offer remains valid. "+reason:
      state.withdrawn?"This drive has ended. Your application was already withdrawn. "+reason:visibleMessage,
    actionHref:"/learn/my-placements/applications",
  }));
  for(let i=0;i<notices.length;i+=200){
    await tx.insert(inAppNotifications).values(notices.slice(i,i+200)).onConflictDoNothing();
  }
  return {rejected,notified:recipients.size,acceptedOffersRetained:accepted.length};
}

/** Notify the source recruiter when a TPO-managed drive is ended. */
export async function tellRecruiterDriveStopped(
  tx:Tx,ctx:RequestContext,jobId:string,collegeId:string,
  mode:"CLOSED"|"CANCELLED",reason:string,
){
  const requests=await tx.select({
    userId:placementRecruiterDriveRequests.recruiterUserId,
  }).from(placementRecruiterDriveRequests)
    .where(and(eq(placementRecruiterDriveRequests.collegeId,collegeId),
      eq(placementRecruiterDriveRequests.approvedJobId,jobId)));
  if(!requests.length)return 0;
  const userIds=[...new Set(requests.map(row=>row.userId))];
  const [event]=await tx.insert(activityEvents).values({
    organizationId:ctx.membership!.organizationId,collegeId,
    actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
    module:"PLACEMENTS",eventType:"RECRUITER_DRIVE_STOPPED",
    subjectType:"placement_job",subjectId:jobId,
    summary:"TPO "+mode.toLowerCase()+" recruiter drive",
    metadata:{mode,reason},
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("RECRUITER_STOP_AUDIT_FAILED");
  await tx.insert(inAppNotifications).values(userIds.map(userId=>({
    userId,eventId:event.id,
    title:mode==="CANCELLED"?"Your drive was cancelled":"Your drive has closed",
    body:reason,
    actionHref:"/recruiter/drives",
  }))).onConflictDoNothing();
  return userIds.length;
}
