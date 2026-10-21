import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {updateWorkspaceBriefSchema,publishedWorkspaceBriefError} from "./workspace-brief-model";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {notifyActiveProjectMembers} from "./project-notification-service";
/** The workspace-authored brief is separate from the immutable template version. */
export async function updateProjectWorkspaceBrief(context:RequestContext,projectIdInput:string,raw:unknown){
 const input=updateWorkspaceBriefSchema.parse(raw);
 const scope=await requireProjectLifecycleMutationAccess(context,projectIdInput);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select().from(projectInstances)
    .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
    .for("update").limit(1);
  if(!project||project.status==="ARCHIVED"||project.status==="COMPLETED"||
     project.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
   throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  // Legacy overviewFactsRef includes opaque template keys and
  // definitionOfDone. A strict edit of the five native fields must not
  // erase unrelated persisted JSON keys; a deliberate empty native field
  // still clears that native field. Only DB-sourced keys are carried.
  if(project.status==="ACTIVE"){
   const issue=publishedWorkspaceBriefError(input.brief);
   if(issue)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  }
  const prior=project.authoredBrief;
  const original=prior&&typeof prior==="object"&&!Array.isArray(prior)
    ?prior as Record<string,unknown>:{};
  // Preserve any historical 'definitionOfDone' key as unedited data, but
  // the native completionConditions is authoritative once explicitly edited.
  const mergedBrief={...original,...input.brief};
  const [updated]=await tx.update(projectInstances).set({
    authoredBrief:mergedBrief,
    updatedAt:new Date(Math.max(Date.now(),project.updatedAt.getTime()+1)),
  }).where(and(eq(projectInstances.id,project.id),eq(projectInstances.collegeId,scope.collegeId))).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  const updatedEvent=await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_SUMMARY_UPDATED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project",subjectId:updated.id,subjectLabel:updated.title,
   summary:"Project workspace brief updated",
   metadata:{projectId:updated.id,fields:["goal","description","deliverables","completionConditions","personas"],
    changedFromVersion:project.updatedAt.toISOString()},groupKey:"project:"+updated.id,
  });
  // MEN-projects-meetings-72: keep an actual inbox event, not a derived attention card.
  // Recipients are looked up again inside this transaction and restricted to active
  // same-college project members. Never send the actor a redundant notification.
  await notifyActiveProjectMembers(tx,updatedEvent.id,{
    projectId:updated.id,collegeId:scope.collegeId,roles:["MENTOR"],
    exceptUserId:context.user.id,
    title:"Project updated",body:updated.title+" — project brief updated.",
    actionHref:"/mentor/projects/"+updated.id+"?tab=overview",
  });
  await notifyActiveProjectMembers(tx,updatedEvent.id,{
    projectId:updated.id,collegeId:scope.collegeId,roles:["LEARNER"],
    exceptUserId:context.user.id,
    title:"Project updated",body:updated.title+" — project brief updated.",
    actionHref:"/learn/projects/"+updated.id+"?tab=overview",
  });
  return {project:updated};
 });
}
