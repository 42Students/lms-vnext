import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents, inAppNotifications, placementCompanies,
  placementCompanyRelationships, placementJobEligibilityPolicies,
  placementJobRoleOptions, placementJobRounds, placementJobs,
  placementRecruiterDriveRequests, placementSeasons,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoJobActor, requireTpoJobCollege } from "./tpo-job-write-base";
import { hrDriveDraftSchema } from "./hr-drive-draft-model";
import { tpoDriveRequestDecisionSchema }
  from "./tpo-drive-request-decision-model";

export class TpoDriveRequestDecisionError extends Error {
  constructor(public readonly code:
    "REQUEST_NOT_FOUND" | "REQUEST_STALE" | "NO_ACTIVE_SEASON" |
    "AMBIGUOUS_ACTIVE_SEASONS" | "COMPANY_INACTIVE" |
    "WORK_MODE_REVIEW_REQUIRED" | "EXTERNAL_APPLICATION_URL_REQUIRED" | "REQUEST_ALREADY_DECIDED") {
    super(code);this.name="TpoDriveRequestDecisionError";
  }
}
const inr = (value:string) => value ? Number(value) : null;
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
      const draft=hrDriveDraftSchema.parse(request.draft);
      const [relation]=await tx.select({id:placementCompanyRelationships.id})
        .from(placementCompanyRelationships)
        .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
        .where(and(eq(placementCompanyRelationships.id,request.companyRelationshipId),
          eq(placementCompanyRelationships.collegeId,collegeId),
          eq(placementCompanyRelationships.status,"ACTIVE"),
          eq(placementCompanies.status,"ACTIVE")))
        .limit(1);
      if(!relation)throw new TpoDriveRequestDecisionError("COMPANY_INACTIVE");
      const seasons=await tx.select({id:placementSeasons.id})
        .from(placementSeasons).where(and(eq(placementSeasons.collegeId,collegeId),
          eq(placementSeasons.status,"ACTIVE")))
        .orderBy(asc(placementSeasons.id)).for("update").limit(2);
      if(seasons.length===0)throw new TpoDriveRequestDecisionError("NO_ACTIVE_SEASON");
      if(seasons.length!==1)throw new TpoDriveRequestDecisionError("AMBIGUOUS_ACTIVE_SEASONS");
      // Do not silently turn a recruiter's "No preference" into on-site.
      // Request clarification; publication changes where students must attend.
      if(draft.workMode==="NO_PREFERENCE")
        throw new TpoDriveRequestDecisionError("WORK_MODE_REVIEW_REQUIRED");
      const workMode=draft.workMode;
      // REC-home-drives-26: off-campus applications must not be silently
      // converted into an internal LMS apply flow on TPO approval.
      if(draft.driveMode==="OFF_CAMPUS"&&!draft.externalApplicationUrl)
        throw new TpoDriveRequestDecisionError("EXTERNAL_APPLICATION_URL_REQUIRED");
      const [job]=await tx.insert(placementJobs).values({
        collegeId,seasonId:seasons[0].id,
        companyRelationshipId:request.companyRelationshipId,
        title:draft.title,description:draft.description,
        employmentType:draft.employmentType,workMode,
        locations:[draft.location],
        recruiterDriveMode:draft.driveMode,eligibleBranches:draft.branches,
        eligiblePassingYear:draft.passingYear?Number(draft.passingYear):null,
        ctcLpa:draft.ctcLpa||null,
        fixedCtcLpa:draft.fixedLpa||null,variableCtcLpa:draft.variableLpa||null,
        stipendPerMonthInr:draft.stipendMonthlyInr?Number(draft.stipendMonthlyInr):null,
        minimumAnnualCtcInr:inr(draft.minimumAnnualCtcInr) ??
          (draft.ctcLpa?Math.round(Number(draft.ctcLpa)*100000):null),
        maximumAnnualCtcInr:inr(draft.maximumAnnualCtcInr) ??
          (draft.ctcLpa?Math.round(Number(draft.ctcLpa)*100000):null),
        createdByUserId:context.user.id,
        status:"DRAFT",applicationMode:draft.driveMode==="OFF_CAMPUS"?"EXTERNAL_ONLY":"INTERNAL",
        externalApplicationUrl:draft.driveMode==="OFF_CAMPUS"?draft.externalApplicationUrl:null,
      }).returning({id:placementJobs.id});
      if(!job)throw new TpoDriveRequestDecisionError("REQUEST_STALE");
      approvedJobId=job.id;
      await tx.insert(placementJobRoleOptions).values({
        jobId:job.id,title:draft.title,
        employmentType:draft.employmentType,workMode,
        locations:[draft.location],isPrimary:true,
        minimumAnnualCtcInr:inr(draft.minimumAnnualCtcInr) ??
          (draft.ctcLpa?Math.round(Number(draft.ctcLpa)*100000):null),
        maximumAnnualCtcInr:inr(draft.maximumAnnualCtcInr) ??
          (draft.ctcLpa?Math.round(Number(draft.ctcLpa)*100000):null),
        fixedLpa:draft.fixedLpa|| (draft.fixedAnnualCtcInr?(Number(draft.fixedAnnualCtcInr)/100000).toFixed(2):null),
        variableLpa:draft.variableLpa|| (draft.variableAnnualCtcInr?(Number(draft.variableAnnualCtcInr)/100000).toFixed(2):null),
        bondMonths:inr(draft.bondMonths),
        bondAmount:draft.bondAmountInr||null,
      });
      await tx.insert(placementJobRounds).values(draft.rounds.map((round,index)=>({
        jobId:job.id,sequence:index+1,
        kind:round.kind,name:round.name,createdByUserId:context.user.id,
      })));
      await tx.insert(placementJobEligibilityPolicies).values({
        jobId:job.id,updatedByUserId:context.user.id,
        minCgpaHundredths:draft.minimumCgpa?Math.round(Number(draft.minimumCgpa)*100):null,
        maxActiveBacklogs:inr(draft.maximumActiveBacklogs),
      });
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
    return {id:saved.id,status:saved.status,approvedJobId,emailSent:false};
  });
}
