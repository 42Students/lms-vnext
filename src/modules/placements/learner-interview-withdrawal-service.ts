import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementJobs,placementOffers} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requireLearnerPlacementAccess} from "./learner-participation-guard";
import {createPlacementRequest,getLearnerPlacementRequestWorkspace} from "./request-service";
import {learnerInterviewWithdrawalInputSchema,type LearnerInterviewWithdrawalTarget} from "./learner-interview-withdrawal-model";
import {isCareerRoundVisible} from "./learner-round-visibility-policy";

/** Use the page's already-authorized request workspace when available.
 * Without it, mutation callers still load their own scoped snapshot. */
export async function getOwnInterviewWithdrawalTargets(
 context:RequestContext,
 sharedWorkspace?:Awaited<ReturnType<typeof getLearnerPlacementRequestWorkspace>>,
){
  const member=await requireLearnerPlacementAccess(context);
  const workspace=sharedWorkspace??await getLearnerPlacementRequestWorkspace(context);
  const applications=await getDb().select({id:placementApplications.id,updatedAt:placementApplications.updatedAt})
    .from(placementApplications).innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
    .where(and(eq(placementApplications.membershipId,member.id),eq(placementJobs.collegeId,member.collegeId),eq(placementApplications.status,"SUBMITTED")));
  const offerRows=await getDb().select({applicationId:placementOffers.applicationId})
    .from(placementOffers).innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
    .where(and(eq(placementApplications.membershipId,member.id),inArray(placementOffers.status,["ISSUED","ACCEPTED"])));
  const offered=new Set(offerRows.map(x=>x.applicationId));
  const pending=new Set(workspace.requests.filter(x=>x.request.requestType==="APPLICATION_WITHDRAWAL"&&x.request.status==="PENDING").map(x=>x.request.applicationId));
  const tokens=new Map(applications.map(x=>[x.id,x.updatedAt.toISOString()]));
  const targets:LearnerInterviewWithdrawalTarget[]=[];
  for(const round of workspace.rounds){
    const token=tokens.get(round.applicationId);
    if(token&&!offered.has(round.applicationId)&&isCareerRoundVisible("INTERVIEW",round.roundKind))
      targets.push({applicationId:round.applicationId,roundId:round.roundId,expectedUpdatedAt:token,pending:pending.has(round.applicationId)});
  }
  return targets;
}
export async function requestOwnInterviewWithdrawal(context:RequestContext,raw:unknown){
  const input=learnerInterviewWithdrawalInputSchema.parse(raw);
  const targets=await getOwnInterviewWithdrawalTargets(context);
  if(!targets.some(x=>x.applicationId===input.applicationId&&x.roundId===input.roundId))
    throw new AuthorizationError("placements.read");
  return createPlacementRequest(context,{
    requestType:"APPLICATION_WITHDRAWAL",applicationId:input.applicationId,
    expectedUpdatedAt:input.expectedUpdatedAt,reason:input.reason,
  });
}
