import "server-only";
import {nextProjectSequence} from "./project-sequence-allocation";

import {randomUUID} from "node:crypto";
import {and,desc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,projectInstances,projectMembers,projectReleases,projectSprints,projectTasks,users} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectLifecycleAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError,postgresConstraintName} from "./errors";
import {mentorTaskCreateParamsSchema,mentorTaskCreateSchema} from "./mentor-task-create-model";
import {notifyProjectMemberships} from "./project-notification-service";

/** Legacy ProjectWorkspaceController accepted a complete tasks/resources array with
 * one workspace update. The vNext contract is intentionally per-item and may
 * update other authors' rows between requests.
 * - Task create: lock the project, optionally CAS sprint.updatedAt.
 * - Task reorder/edit: use projectTaskPlanToken over the complete task set.
 * - Resource create/update/archive: use resource identity and item version.
 * Never emulate legacy "replace all" by deleting omitted tasks/resources. An
 * importer must compare an initial snapshot, reconcile each item, and report
 * partial success/conflicts before claiming whole-section parity. */
export const legacyProjectSectionWriteCrosswalk = {
 tasks: {legacy:"REPLACE_ARRAY",vNext:"ITEM_COMMANDS",optimistic:"SPRINT_UPDATED_AT_OR_TASK_PLAN_TOKEN"},
 resources: {legacy:"REPLACE_ARRAY",vNext:"ITEM_COMMANDS",optimistic:"RESOURCE_ITEM_VERSION"},
} as const;

/** PR-S2-04: create task metadata on registered 0090 fields. */
export async function createMentorProjectTask(context:RequestContext,rawParams:unknown,rawInput:unknown){
  const {projectId}=mentorTaskCreateParamsSchema.parse(rawParams);
  const input=mentorTaskCreateSchema.parse(rawInput);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR"))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  // A disabled tenant must not reveal whether the project ID exists.
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope=await requireProjectLifecycleAccess(context,projectId);
  if(scope.access!=="MENTOR"||!can(context,"projects.read",{
    collegeId:scope.collegeId,organizationId:scope.organizationId,
  }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  try{
    return await getDb().transaction(async tx=>{
      const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt})
        .from(projectInstances)
        .where(and(eq(projectInstances.id,scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId)))
        .for("update").limit(1);
      if(!project||project.deletedAt||!["PLANNED","ACTIVE"].includes(project.status))
        throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      await assertPersistedProjectMutationActor(tx,context,scope);
      const [sprint]=input.sprintId?await tx.select().from(projectSprints)
        .where(and(eq(projectSprints.id,input.sprintId),
          eq(projectSprints.projectId,scope.project.id),
          isNull(projectSprints.deletedAt)))
        .for("update").limit(1):[null];
      if(input.sprintId&&(!sprint||sprint.status==="COMPLETED"||
          sprint.updatedAt.getTime()!==Date.parse(input.expectedSprintUpdatedAt??"")))
        throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      if(input.status!=="TODO"&&sprint?.status!=="ACTIVE")
        throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      if(sprint){
        const [release]=await tx.select({status:projectReleases.status})
          .from(projectReleases)
          .where(and(eq(projectReleases.id,sprint.releaseId),
            eq(projectReleases.projectId,scope.project.id),
             isNull(projectReleases.deletedAt)))
          .limit(1);
        if(!release||release.status==="SHIPPED")
          throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      }

      if(input.assigneeMembershipId){
        const [eligible]=await tx.select({id:projectMembers.id}).from(projectMembers)
          .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
          .innerJoin(users,eq(users.id,collegeMemberships.userId))
          .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
            eq(membershipRoles.role,"LEARNER")))
          .where(and(eq(projectMembers.projectId,scope.project.id),
            eq(projectMembers.membershipId,input.assigneeMembershipId),
            eq(projectMembers.role,"LEARNER"),isNull(projectMembers.endedAt),
            eq(collegeMemberships.collegeId,scope.collegeId),eq(collegeMemberships.status,"ACTIVE"),
            eq(users.platformStatus,"ACTIVE"))).for("share").limit(1);
        if(!eligible)throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
      }
      const [last]=await tx.select({sequence:projectTasks.sequence})
        .from(projectTasks).where(and(eq(projectTasks.projectId,scope.project.id),
          sprint?eq(projectTasks.sprintId,sprint.id):isNull(projectTasks.sprintId)))
        .orderBy(desc(projectTasks.sequence)).limit(1);
      const [created]=await tx.insert(projectTasks).values({
        projectId:scope.project.id,sprintId:sprint?.id??null,
        templateKey:"mentor-"+randomUUID().replaceAll("-",""),
        sequence:nextProjectSequence(last?.sequence,"PROJECT_TASK_INVALID_STATE"),
        title:input.title,description:input.description,approach:input.approach,
        acceptanceCriteria:input.acceptanceCriteria,priority:input.priority,
        status:input.status,assigneeMembershipId:input.assigneeMembershipId,
        blockerReason:input.blockerReason??null,dueDate:input.dueDate??null,
        estimatePoints:input.estimatePoints??null,taskType:input.taskType??null,
      }).returning();
      if(!created)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      // Invalidate other forms holding the old sprint timestamp, if any.
      if(sprint){
        const updatedAt=new Date(Math.max(Date.now(),sprint.updatedAt.getTime()+1));
        await tx.update(projectSprints).set({updatedAt})
          .where(and(eq(projectSprints.id,sprint.id),eq(projectSprints.projectId,scope.project.id)));
      }
      const event=await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_CREATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_task",subjectId:created.id,
        subjectLabel:created.title,summary:"Project task created",
        metadata:{projectId:scope.project.id,sprintId:sprint?.id??null,taskId:created.id,
          hasApproach:Boolean(created.approach),
          status:created.status,assigneeMembershipId:created.assigneeMembershipId},
        groupKey:"project:"+scope.project.id,
        dedupeKey:"project-task:"+created.id+":created",
      });
      if(created.assigneeMembershipId){
        await notifyProjectMemberships(tx,event.id,{
          projectId:scope.project.id,collegeId:scope.collegeId,
          membershipIds:[created.assigneeMembershipId],
          title:"New task assigned",body:"You have been assigned "+created.title+".",
          actionHref:"/learn/projects/"+scope.project.id+"?tab=board",
        });
      }
      return created;
    });
  }catch(error){
    if(["project_tasks_sprint_sequence_uq","project_tasks_project_key_uq"]
      .includes(postgresConstraintName(error)??""))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    throw error;
  }
}
