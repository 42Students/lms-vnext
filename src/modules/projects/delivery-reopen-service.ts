import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,projectEvaluations,projectInstances,projectSubmissions} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {projectDeliveryLockInputSchema,mayReopenApprovedDelivery} from "./pr-s2-07-delivery-reopen-model";
import {projectSubmissionIdSchema} from "./validation";

/** Reopen records a scoped, immutable event; the approved version is never mutated. */
export async function reopenApprovedProjectDelivery(
  context:RequestContext,projectIdInput:string,submissionIdInput:string,rawInput:unknown,
){
  const scope=await requireProjectLifecycleMutationAccess(context,projectIdInput);
  const submissionId=projectSubmissionIdSchema.parse(submissionIdInput);
  const input=projectDeliveryLockInputSchema.parse(rawInput);
  return getDb().transaction(async tx=>{
    const [project]=await tx.select({status:projectInstances.status})
      .from(projectInstances).where(and(
        eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId),
      )).for("update").limit(1);
    if(!project||project.status!=="ACTIVE")
      throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
    const [latest]=await tx.select().from(projectSubmissions)
      .where(eq(projectSubmissions.projectId,scope.project.id))
      .orderBy(desc(projectSubmissions.version))
      .for("update").limit(1);
    if(!latest||latest.id!==submissionId||latest.status!=="APPROVED"||
      latest.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
      throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
    const [evaluation]=await tx.select({id:projectEvaluations.id}).from(projectEvaluations)
      .where(and(eq(projectEvaluations.projectId,scope.project.id),
        eq(projectEvaluations.submissionId,latest.id))).limit(1);
    if(!mayReopenApprovedDelivery(project.status,Boolean(evaluation)))
      throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
    const [previous]=await tx.select({id:activityEvents.id}).from(activityEvents)
      .where(and(
        eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_REOPENED),
        eq(activityEvents.collegeId,scope.collegeId),
        eq(activityEvents.subjectType,"project_submission"),
        eq(activityEvents.subjectId,latest.id),
      )).limit(1);
    if(previous)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_REOPENED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_submission",subjectId:latest.id,
      subjectLabel:"Project delivery",summary:"Approved Project delivery reopened",
      metadata:{projectId:scope.project.id,version:latest.version,reason:input.reason},
      groupKey:"project:"+scope.project.id+":deliveries",
      dedupeKey:"project-delivery:"+latest.id+":reopened",
    });
    return {submissionId:latest.id,projectId:scope.project.id,reopened:true};
  });
}
