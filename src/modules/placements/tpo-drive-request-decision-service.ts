import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents, inAppNotifications, placementRecruiterDriveRequests,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoJobActor, requireTpoJobCollege } from "./tpo-job-write-base";
import { createRecruiterApprovedDraftJob,RecruiterDraftApprovalError } from "./recruiter-approved-draft-job-service";
import { tpoDriveRequestDecisionSchema }
  from "./tpo-drive-request-decision-model";

/** Old REQUEST/SENT_BACK/REJECTED lived on the job. vNext keeps the
 * recruiter conversation on the request and creates a linked, unpublished
 * job only on approval; never pretend the draft itself is SENT_BACK. */
export const TPO_DRIVE_REQUEST_LEGACY_CROSSWALK={
 REQUEST:{requestStatus:"REQUEST",jobStatus:null},
 SENT_BACK:{requestStatus:"SENT_BACK",jobStatus:null},
 REJECTED:{requestStatus:"REJECTED",jobStatus:null},
 APPROVED:{requestStatus:"DRAFT",jobStatus:"DRAFT"},
} as const;
export class TpoDriveRequestDecisionError extends Error {
  constructor(public readonly code:
    "REQUEST_NOT_FOUND" | "REQUEST_STALE" | "NO_ACTIVE_SEASON" |
    "AMBIGUOUS_ACTIVE_SEASONS" | "COMPANY_INACTIVE" | "UNSUPPORTED_EMPLOYMENT_TYPE" |
    "WORK_MODE_REVIEW_REQUIRED" | "EXTERNAL_APPLICATION_URL_REQUIRED" | "REQUEST_ALREADY_DECIDED") {
    super(code);this.name="TpoDriveRequestDecisionError";
  }
}
/** Approving creates a real DRAFT, never publishes implicitly. All writes are atomic. */
export async function decideTpoRecruiterDriveRequest(
  context:RequestContext, rawRequestId:unknown, raw:unknown,
) {
  const collegeId=await requireTpoJobCollege(context);
  const requestId=tpoDriveRequestDecisionSchema.shape.requestId.parse(rawRequestId);
  const input=tpoDriveRequestDecisionSchema.parse({...(raw as object),requestId});
  return getDb().transaction(async tx=>{
    await requireTpoJobActor(tx,context);
    const [request]=await tx.select().from(placementRecruiterDriveRequests)
      .where(and(eq(placementRecruiterDriveRequests.id,requestId),
        eq(placementRecruiterDriveRequests.collegeId,collegeId)))
      .for("update").limit(1);
    if(!request)throw new TpoDriveRequestDecisionError("REQUEST_NOT_FOUND");
    if(request.status!==input.expectedStatus)
      throw new TpoDriveRequestDecisionError("REQUEST_STALE");
    if(request.approvedJobId||!["REQUEST","SENT_BACK"].includes(request.status))
      throw new TpoDriveRequestDecisionError("REQUEST_ALREADY_DECIDED");
    const now=new Date();
    let approvedJobId:string|null=null;
    if(input.action==="APPROVE_LATER"){
      try{
        approvedJobId=await createRecruiterApprovedDraftJob(tx,request,context.user.id);
      }catch(error){
        if(error instanceof RecruiterDraftApprovalError){
          throw new TpoDriveRequestDecisionError(error.code==="REQUEST_STALE"?"REQUEST_STALE":error.code);
        }
        throw error;
      }
    }
    const status=input.action==="APPROVE_LATER"?"DRAFT":
      input.action==="DECLINE"?"REJECTED":"SENT_BACK";
    const [saved]=await tx.update(placementRecruiterDriveRequests).set({
      status,decisionNote:input.reason,decidedByUserId:context.user.id,
      decidedAt:now,updatedAt:now,
      ...(approvedJobId?{approvedJobId}:{}),
    }).where(and(eq(placementRecruiterDriveRequests.id,requestId),
      eq(placementRecruiterDriveRequests.collegeId,collegeId),
      eq(placementRecruiterDriveRequests.status,input.expectedStatus)))
      .returning({id:placementRecruiterDriveRequests.id,status:placementRecruiterDriveRequests.status});
    if(!saved)throw new TpoDriveRequestDecisionError("REQUEST_STALE");
    const [event]=await tx.insert(activityEvents).values({
      organizationId:context.membership!.organizationId,
      collegeId,actorUserId:context.user.id,
      actorMembershipId:context.membership!.id,
      module:"PLACEMENTS",eventType:"RECRUITER_DRIVE_REQUEST_DECIDED",
      subjectType:"recruiter_drive_request",subjectId:requestId,
      summary:"TPO "+input.action.toLowerCase().replaceAll("_"," ")+" recruiter drive request",
      metadata:{action:input.action,previousStatus:request.status,nextStatus:status,
        approvedJobId,reason:input.reason,emailSent:false},
    }).returning({id:activityEvents.id});
    if(!event)throw new TpoDriveRequestDecisionError("REQUEST_STALE");
    await tx.insert(inAppNotifications).values({
      userId:request.recruiterUserId,eventId:event.id,
      title:input.action==="APPROVE_LATER"?"Drive request approved":
        input.action==="DECLINE"?"Drive request not accepted":"Changes requested for your drive",
      body:input.reason,
      actionHref:"/recruiter/drives",
    }).onConflictDoNothing();
    return {id:saved.id,status:saved.status,approvedJobId,emailSent:false,
      legacyLifecycle:input.action==="APPROVE_LATER"?"APPROVED":
        input.action==="DECLINE"?"REJECTED":"SENT_BACK",
      confirmedAction:input.action,
      draftRequiresSeparatePublish:Boolean(approvedJobId),
      nextHref:approvedJobId?"/tpo/placements/jobs/"+approvedJobId:
        "/tpo/requests",
    };
  });
}
