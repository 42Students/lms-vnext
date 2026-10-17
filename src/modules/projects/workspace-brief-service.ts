import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectManageAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {updateWorkspaceBriefSchema} from "./workspace-brief-model";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
/** The workspace-authored brief is separate from the immutable template version. */
export async function updateProjectWorkspaceBrief(context:RequestContext,projectIdInput:string,raw:unknown){
 const input=updateWorkspaceBriefSchema.parse(raw);
 const scope=await requireProjectManageAccess(context,projectIdInput);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select().from(projectInstances)
    .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
    .for("update").limit(1);
  if(!project||project.status==="ARCHIVED"||
     project.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
   throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  const [updated]=await tx.update(projectInstances).set({
    authoredBrief:input.brief,
    updatedAt:new Date(Math.max(Date.now(),project.updatedAt.getTime()+1)),
  }).where(and(eq(projectInstances.id,project.id),eq(projectInstances.collegeId,scope.collegeId))).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_SUMMARY_UPDATED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project",subjectId:updated.id,subjectLabel:updated.title,
   summary:"Project workspace brief updated",
   metadata:{projectId:updated.id,fields:["goal","description","deliverables","completionConditions","personas"],
    changedFromVersion:project.updatedAt.toISOString()},groupKey:"project:"+updated.id,
  });
  return {project:updated};
 });
}
