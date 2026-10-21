import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectReleases, projectSprints } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { can } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { requireProjectLifecycleAccess } from "./access";
import { assertPersistedProjectMutationActor } from "./persisted-mentor-mutation";
import { ProjectsServiceError } from "./errors";
import { mentorSprintDetailsParamsSchema, mentorSprintDetailsSchema,
  sprintDetailsChanged } from "./mentor-sprint-details-model";

/** Edit registered 0123 sprint plan fields; lock sprint dates once ACTIVE. */
export async function updateMentorSprintDetails(
  context: RequestContext, rawParams: unknown, rawInput: unknown,
) {
  const params = mentorSprintDetailsParamsSchema.parse(rawParams);
  const input = mentorSprintDetailsSchema.parse(rawInput);
  // Check entitlement before resolving untrusted project IDs.
  const modules = await resolveOptionalModuleAccess(context);
  if (!modules.projects.enabled) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope = await requireProjectLifecycleAccess(context,params.projectId);
  if (!can(context,"projects.read",{
    collegeId:scope.collegeId,organizationId:scope.organizationId,
  })) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const expected = new Date(input.expectedUpdatedAt);
  const db = getDb();
  return db.transaction(async tx => {
    const [project] = await tx.select({status:projectInstances.status})
      .from(projectInstances)
      .where(and(eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update").limit(1);
    if (!project || !["PLANNED","ACTIVE"].includes(project.status)) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    await assertPersistedProjectMutationActor(tx,context,scope);
    const [sprint] = await tx.select().from(projectSprints)
      .where(and(eq(projectSprints.id,params.sprintId),
        eq(projectSprints.projectId,scope.project.id),
        isNull(projectSprints.deletedAt)))
      .for("update").limit(1);
    if (!sprint) throw new ProjectsServiceError("PROJECT_SPRINT_NOT_FOUND");
    if (!["PLANNED","ACTIVE"].includes(sprint.status)) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    const [release] = await tx.select({status:projectReleases.status})
      .from(projectReleases)
      .where(and(eq(projectReleases.id,sprint.releaseId),
        eq(projectReleases.projectId,scope.project.id)))
      .limit(1);
    if (!release || release.status==="SHIPPED") {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    if (sprint.updatedAt.getTime()!==expected.getTime()) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    if(sprint.status==="ACTIVE"&&
       (sprint.startDate!==input.startDate||sprint.endDate!==input.endDate||
         sprint.dueDate!==input.dueDate))
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    if (!sprintDetailsChanged(sprint,input)) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    // PostgreSQL timestamptz retains microseconds while a JavaScript Date
    // only retains milliseconds. An exact timestamp equality in UPDATE WHERE
    // would reject the very row we just locked and checked above when the
    // persisted timestamp has nonzero fractional microseconds.
    //
    // SELECT FOR UPDATE serializes competing writers; the millisecond
    // expectedUpdatedAt check above is performed against the locked current
    // version. Incrementing by at least 1ms preserves stale-write detection.
    const now = new Date(Math.max(Date.now(), sprint.updatedAt.getTime()+1));
    const [updated] = await tx.update(projectSprints).set({
      title:input.title,
      ...(input.dueLabel!==undefined?{dueLabel:input.dueLabel}:{}),
      description:input.description,goal:input.goal,
      definitionOfDone:input.definitionOfDone,startDate:input.startDate,
      endDate:input.endDate,dueDate:input.dueDate,updatedAt:now,
    }).where(and(
      eq(projectSprints.id,sprint.id),
      eq(projectSprints.projectId,scope.project.id),
    )).returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_sprint",subjectId:updated.id,
      subjectLabel:updated.title,summary:"Project sprint details updated",
      metadata:{projectId:scope.project.id,sprintId:updated.id,changedFields:[
        ...(sprint.title!==input.title?["title"]:[]),
        ...(input.dueLabel!==undefined&&sprint.dueLabel!==input.dueLabel?["dueLabel"]:[]),
        ...(sprint.description!==input.description?["description"]:[]),
        ...(["goal","definitionOfDone","startDate","endDate","dueDate"] as const)
          .filter(key=>sprint[key]!==input[key]),
      ]},
      groupKey:"project:"+scope.project.id,
      dedupeKey:"project-sprint:"+updated.id+":details:"+randomUUID(),
    });
    return updated;
  });
}
