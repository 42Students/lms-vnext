import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq, ne, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { mayCloseProjectSprint } from "./sprint-close-policy";
import { projectInstances, projectReleases, projectSprints, projectTasks, projectMembers } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { requireProjectLifecycleMutationAccess } from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import { ProjectsServiceError, postgresConstraintName } from "./errors";
import {
  mentorSprintCreateParamsSchema, mentorSprintCreateSchema,
  mentorSprintTransitionParamsSchema, mentorSprintTransitionSchema,
  isValidMentorSprintTransition,
} from "./mentor-sprint-write-model";

async function mentorSprintWriteScope(context: RequestContext, projectId: string) {
  return requireProjectLifecycleMutationAccess(context, projectId);
}

/** Serializes sprint creations under project-row lock, avoiding sibling sequence races. */
export async function createMentorProjectSprint(
  context:RequestContext,rawParams:unknown,rawInput:unknown,
) {
  const params=mentorSprintCreateParamsSchema.parse(rawParams);
  const input=mentorSprintCreateSchema.parse(rawInput);
  const scope=await mentorSprintWriteScope(context,params.projectId);
  try {
    return await getDb().transaction(async tx=>{
      const [project]=await tx.select({status:projectInstances.status})
        .from(projectInstances)
        .where(and(eq(projectInstances.id,scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId)))
        .for("update").limit(1);
      if(!project || !["PLANNED","ACTIVE"].includes(project.status)) {
        throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      }
      await assertPersistedProjectMutationActor(tx,context,scope);
      const [release]=await tx.select({id:projectReleases.id,status:projectReleases.status})
        .from(projectReleases)
        .where(and(eq(projectReleases.id,input.releaseId),
          eq(projectReleases.projectId,scope.project.id)))
        .for("update").limit(1);
      if(!release || release.status==="SHIPPED") {
        throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
      }
      const [last]=await tx.select({sequence:projectSprints.sequence})
        .from(projectSprints)
        .where(eq(projectSprints.releaseId,release.id))
        .orderBy(desc(projectSprints.sequence)).limit(1);
      const now=new Date();
      const [sprint]=await tx.insert(projectSprints).values({
        projectId:scope.project.id,
        releaseId:release.id,
        templateKey:"mentor-"+randomUUID().replaceAll("-",""),
        title:input.title,
        description:input.description,goal:input.goal,definitionOfDone:input.definitionOfDone,
        startDate:input.startDate,endDate:input.endDate,dueDate:input.dueDate,
        sequence:(last?.sequence??-1)+1,
        status:"PLANNED",
        updatedAt:now,
      }).returning();
      if(!sprint) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_sprint",subjectId:sprint.id,
        subjectLabel:sprint.title,summary:"Project sprint created",
        metadata:{projectId:scope.project.id,sprintId:sprint.id,action:"CREATE"},
        groupKey:"project:"+scope.project.id,
        dedupeKey:"project-sprint:"+sprint.id+":created",
      });
      return sprint;
    });
  } catch(error) {
    const constraint=postgresConstraintName(error);
    if(constraint==="project_sprints_release_sequence_uq" ||
       constraint==="project_sprints_project_key_uq") {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    throw error;
  }
}

/** Row-locked optimistic transitions; timestamps compare at JS millisecond precision. */
export async function transitionMentorProjectSprint(
  context:RequestContext,rawParams:unknown,rawInput:unknown,
) {
  const params=mentorSprintTransitionParamsSchema.parse(rawParams);
  const input=mentorSprintTransitionSchema.parse(rawInput);
  const scope=await mentorSprintWriteScope(context,params.projectId);
  return getDb().transaction(async tx=>{
    const [project]=await tx.select({id:projectInstances.id,status:projectInstances.status})
      .from(projectInstances)
      .where(and(eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update").limit(1);
    if(!project || project.status==="ARCHIVED" || project.status==="COMPLETED") {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    await assertPersistedProjectMutationActor(tx,context,scope);
    if (input.action !== "COMPLETE") {
      const [primary] = await tx.select({id:projectMembers.id}).from(projectMembers)
        .where(and(eq(projectMembers.projectId,scope.project.id),
          eq(projectMembers.role,"MENTOR"),eq(projectMembers.isPrimary,true),
          isNull(projectMembers.endedAt))).limit(1);
      if (!primary) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    const [sprint]=await tx.select().from(projectSprints)
      .where(and(eq(projectSprints.id,params.sprintId),
        eq(projectSprints.projectId,scope.project.id),
        isNull(projectSprints.deletedAt)))
      .for("update").limit(1);
    if(!sprint) throw new ProjectsServiceError("PROJECT_SPRINT_NOT_FOUND");
    if(!isValidMentorSprintTransition(sprint.status,input.action) ||
       sprint.updatedAt.getTime()!==new Date(input.expectedUpdatedAt).getTime()) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    const [release]=await tx.select({id:projectReleases.id,status:projectReleases.status})
      .from(projectReleases)
      .where(and(eq(projectReleases.id,sprint.releaseId),
        eq(projectReleases.projectId,scope.project.id)))
      .for("update").limit(1);
    if(!release || release.status==="SHIPPED") {
      throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
    }
    if(input.action==="START" || input.action==="REOPEN") {
      const [active]=await tx.select({id:projectSprints.id}).from(projectSprints)
        .where(and(eq(projectSprints.projectId,scope.project.id),
          eq(projectSprints.status,"ACTIVE"),isNull(projectSprints.deletedAt),
          ne(projectSprints.id,sprint.id)))
        .limit(1);
      if(active) throw new ProjectsServiceError("PROJECT_SPRINT_ALREADY_ACTIVE");
    } else {
      const [openTask]=await tx.select({id:projectTasks.id}).from(projectTasks)
        .where(and(eq(projectTasks.projectId,scope.project.id),
          eq(projectTasks.sprintId,sprint.id),isNull(projectTasks.deletedAt),
          ne(projectTasks.status,"DONE")))
        .limit(1);
      if(!mayCloseProjectSprint(openTask ? 1 : 0))
        throw new ProjectsServiceError("PROJECT_SPRINT_HAS_OPEN_TASKS");
    }
    const status=input.action==="COMPLETE"?"COMPLETED":"ACTIVE";
    const now=new Date(Math.max(Date.now(),sprint.updatedAt.getTime()+1));
    const actorMembershipId=context.membership?.collegeId===scope.collegeId?
      context.membership.id:null;
    const [updated]=await tx.update(projectSprints)
      .set({
        status,updatedAt:now,
        ...(input.action==="COMPLETE"?
          {completedAt:now,completedByMembershipId:actorMembershipId}:
          {startedAt:now,startedByMembershipId:actorMembershipId,
           ...(input.action==="REOPEN"?
             {completedAt:null,completedByMembershipId:null}:{})}),
      })
      .where(and(eq(projectSprints.id,sprint.id),
        eq(projectSprints.projectId,scope.project.id),
        eq(projectSprints.status,sprint.status),isNull(projectSprints.deletedAt)))
      .returning();
    if(!updated) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    if(input.action!=="COMPLETE") {
      await tx.update(projectReleases)
        .set({status:"IN_PROGRESS",updatedAt:now})
        .where(and(eq(projectReleases.id,release.id),
          eq(projectReleases.projectId,scope.project.id),
          ne(projectReleases.status,"SHIPPED")));
      if(project.status==="PLANNED") await tx.update(projectInstances)
        .set({status:"ACTIVE",updatedAt:now})
        .where(and(eq(projectInstances.id,scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId),
          eq(projectInstances.status,"PLANNED")));
    }
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_sprint",subjectId:updated.id,
      subjectLabel:updated.title,summary:"Project sprint status updated",
      metadata:{
        projectId:scope.project.id,sprintId:updated.id,
        action:input.action,from:sprint.status,to:updated.status,
        actorUserId:context.user.id,actorMembershipId,
        priorStartedAt:sprint.startedAt?.toISOString()??null,
        priorCompletedAt:sprint.completedAt?.toISOString()??null,
        completedAt:updated.completedAt?.toISOString()??null,
        startedAt:updated.startedAt?.toISOString()??null,
      },
      groupKey:"project:"+scope.project.id,
      dedupeKey:"project-sprint:"+updated.id+":transition:"+randomUUID(),
    });
    return updated;
  });
}
