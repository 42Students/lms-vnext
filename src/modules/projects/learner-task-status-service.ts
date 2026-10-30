import "server-only";
import {randomUUID} from "node:crypto";
import {and,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,projectInstances,projectMembers,
 projectReleases,projectSprints,projectTasks,users} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {canLearnerMoveOwnTask,learnerTaskStatusInputSchema} from "./learner-task-status-policy";
import {z} from "zod";

/** LEARNER-projects-25: only active learner member and exact assigned task.
 * All state/ownership checks are repeated under DB locks. No DONE/IN_REVIEW escape. */
export async function moveOwnLearnerProjectTask(context:RequestContext,rawProjectId:unknown,
 rawTaskId:unknown,rawInput:unknown){
 const projectId=z.string().uuid().parse(rawProjectId);
 const taskId=z.string().uuid().parse(rawTaskId);
 const input=learnerTaskStatusInputSchema.parse(rawInput);
 const membership=context.membership;
 if(!membership || !membership.roles.includes("LEARNER"))
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="LEARNER")throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status})
   .from(projectInstances).where(and(eq(projectInstances.id,projectId),
    eq(projectInstances.collegeId,scope.collegeId),isNull(projectInstances.deletedAt))).for("update").limit(1);
  if(!project || project.status!=="ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [member]=await tx.select({id:projectMembers.id}).from(projectMembers)
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
   .where(and(eq(projectMembers.projectId,projectId),
    eq(projectMembers.membershipId,membership.id),eq(projectMembers.role,"LEARNER"),
    eq(projectMembers.roleKind,"LEARNER"),eq(projectMembers.canMutate,true),
    isNull(projectMembers.endedAt),eq(collegeMemberships.status,"ACTIVE"),
    eq(collegeMemberships.collegeId,scope.collegeId),eq(collegeMemberships.userId,context.user.id),
    eq(users.platformStatus,"ACTIVE"))).for("share").limit(1);
  if(!member)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const [task]=await tx.select().from(projectTasks).where(and(
    eq(projectTasks.id,taskId),eq(projectTasks.projectId,projectId),
      isNull(projectTasks.deletedAt))).for("update").limit(1);
  if(!task)throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
  if(task.assigneeMembershipId!==membership.id ||
   task.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt) ||
   !canLearnerMoveOwnTask(task.status,input.status))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  if(task.sprintId===null)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [sprint]=await tx.select({status:projectSprints.status,releaseId:projectSprints.releaseId})
   .from(projectSprints).where(and(eq(projectSprints.id,task.sprintId),
    eq(projectSprints.projectId,projectId),isNull(projectSprints.deletedAt))).for("share").limit(1);
  if(sprint?.status!=="ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [release]=await tx.select({status:projectReleases.status}).from(projectReleases)
   .where(and(eq(projectReleases.id,sprint.releaseId),eq(projectReleases.projectId,projectId),
     isNull(projectReleases.deletedAt))).for("share").limit(1);
  if(!release || !["PLANNED","IN_PROGRESS"].includes(release.status))throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const now=new Date(Math.max(Date.now(),task.updatedAt.getTime()+1));
  const [updated]=await tx.update(projectTasks).set({status:input.status,
    blockerReason:input.status==="BLOCKED"?input.blockerReason!:null,updatedAt:now})
   .where(and(eq(projectTasks.id,task.id),eq(projectTasks.projectId,projectId),
    eq(projectTasks.status,task.status),eq(projectTasks.assigneeMembershipId,membership.id),
    isNull(projectTasks.deletedAt),
    sql`date_trunc('milliseconds', ${projectTasks.updatedAt}) = ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`))
   .returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_STATUS_CHANGED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project_task",subjectId:task.id,subjectLabel:task.title,
   summary:input.status==="BLOCKED"?"Learner reported a task blocker":"Learner updated task status",
   metadata:{projectId,taskId,previousStatus:task.status,nextStatus:updated.status},
   groupKey:"project:"+projectId,dedupeKey:"learner-task-status:"+task.id+":"+randomUUID(),
  });
  return updated;
 });
}
