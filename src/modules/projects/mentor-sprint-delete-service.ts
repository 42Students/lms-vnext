import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectMeetings,projectReleases,projectSprints,projectTasks} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
const pathSchema=z.strictObject({projectId:z.string().uuid(),sprintId:z.string().uuid()});
const bodySchema=z.strictObject({expectedUpdatedAt:z.iso.datetime({offset:true}),confirmUnlink:z.literal(true)});
/** MEN-projects-meetings-35: unlink task plan only while still planned, preserving task identities. */
export async function deleteMentorProjectSprint(context:RequestContext,rawPath:unknown,rawBody:unknown){
 const path=pathSchema.parse(rawPath),input=bodySchema.parse(rawBody);
 const scope=await requireProjectLifecycleMutationAccess(context,path.projectId);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId),isNull(projectInstances.deletedAt)))
   .for("update").limit(1);
  if(!project||!["PLANNED","ACTIVE"].includes(project.status))
   throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  await assertPersistedProjectMutationActor(tx,context,scope);
  const [sprint]=await tx.select().from(projectSprints)
    .where(and(eq(projectSprints.id,path.sprintId),eq(projectSprints.projectId,scope.project.id),isNull(projectSprints.deletedAt)))
    .for("update").limit(1);
  if(!sprint||sprint.status!=="PLANNED"||
      sprint.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
   throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  const [release]=await tx.select({status:projectReleases.status}).from(projectReleases)
    .where(and(eq(projectReleases.id,sprint.releaseId),eq(projectReleases.projectId,scope.project.id),
       isNull(projectReleases.deletedAt)))
    .limit(1);
  if(!release||release.status==="SHIPPED")throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  const [meeting]=await tx.select({id:projectMeetings.id}).from(projectMeetings)
    .where(and(eq(projectMeetings.projectId,scope.project.id),eq(projectMeetings.linkedSprintId,sprint.id)))
    .limit(1);
  const [carryHistory]=await tx.select({id:projectTasks.id}).from(projectTasks)
    .where(and(eq(projectTasks.projectId,scope.project.id),eq(projectTasks.carriedFromSprintId,sprint.id)))
    .limit(1);
  if(meeting||carryHistory)throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  const moved=await tx.update(projectTasks).set({
    sprintId:null,carriedFromSprintId:sprint.id,carriedOverAt:new Date(),updatedAt:new Date(),
  }).where(and(eq(projectTasks.projectId,scope.project.id),
      eq(projectTasks.sprintId,sprint.id),isNull(projectTasks.deletedAt)))
    .returning({id:projectTasks.id});
  // Preserve a workspace-deleted sprint as a template merge tombstone, and keep
  // carriedFromSprintId references so task history retains the source sprint.
  const [removed]=await tx.update(projectSprints).set({
    deletedAt:new Date(),deletedByWorkspace:true,updatedAt:new Date(),
  }).where(and(eq(projectSprints.id,sprint.id),
    eq(projectSprints.projectId,scope.project.id),isNull(projectSprints.deletedAt)))
    .returning({id:projectSprints.id});
  if(!removed)throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project_sprint",subjectId:sprint.id,subjectLabel:sprint.title,
    summary:"Planned sprint removed; tasks returned to product backlog",
    metadata:{projectId:scope.project.id,sprintId:sprint.id,
      templateKey:sprint.templateKey,unlinkedTasks:moved.length,deleted:true,
      deletedByWorkspace:true,deletionSource:"WORKSPACE",
      deletedAt:removed?new Date().toISOString():null},
    groupKey:"project:"+scope.project.id,
  });
  return {deleted:true,unlinkedTasks:moved.length};
 });
}
