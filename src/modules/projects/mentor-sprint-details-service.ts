import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectReleases, projectSprints } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { can } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { requireProjectLifecycleAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { mentorSprintDetailsParamsSchema, mentorSprintDetailsSchema,
  sprintDetailsChanged } from "./mentor-sprint-details-model";

/** Edit registered sprint title/description only; all other state remains lifecycle-owned. */
export async function updateMentorSprintDetails(
  context: RequestContext, rawParams: unknown, rawInput: unknown,
) {
  const params = mentorSprintDetailsParamsSchema.parse(rawParams);
  const input = mentorSprintDetailsSchema.parse(rawInput);
  const scope = await requireProjectLifecycleAccess(context,params.projectId);
  if (!can(context,"projects.read",{
    collegeId:scope.collegeId,organizationId:scope.organizationId,
  })) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const modules = await resolveOptionalModuleAccess(context);
  if (!modules.projects.enabled) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
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
    const [sprint] = await tx.select().from(projectSprints)
      .where(and(eq(projectSprints.id,params.sprintId),
        eq(projectSprints.projectId,scope.project.id)))
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
    if (!sprintDetailsChanged(sprint,input)) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    const now = new Date(Math.max(Date.now(), sprint.updatedAt.getTime()+1));
    const [updated] = await tx.update(projectSprints).set({
      title:input.title,description:input.description,updatedAt:now,
    }).where(and(
      eq(projectSprints.id,sprint.id),
      eq(projectSprints.projectId,scope.project.id),
      eq(projectSprints.updatedAt,sprint.updatedAt),
    )).returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_sprint",subjectId:updated.id,
      subjectLabel:updated.title,summary:"Project sprint details updated",
      metadata:{projectId:scope.project.id,sprintId:updated.id,changedFields:[
        ...(sprint.title!==input.title?["title"]:[]),
        ...(sprint.description!==input.description?["description"]:[]),
      ]},
      groupKey:"project:"+scope.project.id,
      dedupeKey:"project-sprint:"+updated.id+":details:"+randomUUID(),
    });
    return updated;
  });
}
