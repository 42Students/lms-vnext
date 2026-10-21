import {
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {notifyActiveProjectMembers} from "./project-notification-service";
import {projectResourceAuditInput} from "./mentor-resource-audit-model";
import {randomUUID} from "node:crypto";
import {z} from "zod";
import {
  projectInstances,
  projectResources,
  projectSprints,
  projectTasks,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requireProjectLifecycleMutationAccess,
  requireProjectReadAccess,
} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  createProjectResourceInputSchema,
  projectResourceIdSchema,
  updateProjectResourceInputSchema,
  archiveProjectResourceInputSchema,
  type CreateProjectResourceInput,
  type UpdateProjectResourceInput,
} from "./validation";

function mapResourceConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "project_resources_project_sequence_uq"
  ) {
    return new ProjectsServiceError(
      "PROJECT_RESOURCE_SEQUENCE_CONFLICT",
    );
  }

  return error;
}

function ensureMutableProject(
  status: string,
) {
  if (status === "ARCHIVED" || status === "COMPLETED") {
    throw new ProjectsServiceError(
      "PROJECT_RESOURCE_INVALID_STATE",
    );
  }
}

export async function listProjectResources(
  context: RequestContext,
  projectIdInput: string,
) {
  // Disabled tenant feature flags must deny before loading supplied project IDs.
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );

  return getDb()
    .select()
    .from(projectResources)
    .where(
      and(
        eq(
          projectResources.projectId,
          scope.project.id,
        ),
        scope.access === "ADMIN" || scope.access === "MENTOR" ? undefined : eq(projectResources.status, "ACTIVE"),
        scope.access === "ADMIN" || scope.access === "MENTOR" ? undefined : eq(projectResources.visibility, "TEAM"),
      ),
    )
    .orderBy(asc(projectResources.sequence));
}

export async function createProjectResource(
  context: RequestContext,
  projectIdInput: string,
  rawInput: CreateProjectResourceInput,
) {
  // Disabled tenant feature flags must deny before loading supplied project IDs.
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );
  const input =
    createProjectResourceInputSchema.parse(
      rawInput,
    );
  if (!["ADMIN","MENTOR","LEARNER"].includes(scope.access))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if(scope.access === "LEARNER" && (input.required || input.visibility === "MENTOR_ONLY" || input.pinned || input.accessNotes || input.sprintId || input.taskId || (input.status && input.status !== "ACTIVE")))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(and(eq(projectInstances.id, scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId)))
        .for("update")
        .limit(1);

      if (!project) {
        throw new ProjectsServiceError("PROJECT_NOT_FOUND");
      }
      ensureMutableProject(project.status);
      if(scope.access==="ADMIN"||scope.access==="MENTOR")
        await assertPersistedProjectMutationActor(tx,context,scope);
      if(scope.access==="LEARNER" && project.status!=="ACTIVE")
        throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");

      if(input.sprintId){
        const [associated]=await tx.select({id:projectSprints.id})
          .from(projectSprints).where(and(eq(projectSprints.id,input.sprintId),
            eq(projectSprints.projectId,scope.project.id))).limit(1);
        if(!associated)throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
      }
      if(input.taskId){
        const [associated]=await tx.select({id:projectTasks.id,sprintId:projectTasks.sprintId})
          .from(projectTasks).where(and(eq(projectTasks.id,input.taskId),
            eq(projectTasks.projectId,scope.project.id))).limit(1);
        if(!associated || (input.sprintId && associated.sprintId!==input.sprintId))
          throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
      }

      const [latest] = await tx
        .select({ sequence: projectResources.sequence })
        .from(projectResources)
        .where(eq(projectResources.projectId, scope.project.id))
        .orderBy(desc(projectResources.sequence))
        .limit(1);

      const [resource] = await tx
        .insert(projectResources)
        .values({
          projectId: scope.project.id,
          templateKey: null,
          title: input.title,
          description: input.description ?? null,
          url: input.url ?? null,
          required: input.required ?? false,
          visibility: input.visibility ?? "TEAM",
          resourceType: input.resourceType ?? (input.url ? "LINK" : "NOTE"),
          status: scope.access==="LEARNER"?"ACTIVE":input.status??"ACTIVE",
          pinned: scope.access==="LEARNER"?false:input.pinned??false,
          accessNotes: scope.access==="LEARNER"?null:input.accessNotes??null,
          sprintId: scope.access==="LEARNER"?null:input.sprintId??null,
          taskId: scope.access==="LEARNER"?null:input.taskId??null,
          sequence: (latest?.sequence ?? -1) + 1,
        })
        .returning();

      if(!resource)throw new ProjectsServiceError("PROJECT_RESOURCE_NOT_FOUND");
      const event=await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("CREATED",{
        projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
      },resource));
      await notifyActiveProjectMembers(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,
        roles:["MENTOR"],exceptUserId:context.user.id,
        title:"New project resource",body:"A resource was added to your project.",
        actionHref:"/mentor/projects/"+scope.project.id+"?tab=resources",
      });
      if(resource.visibility==="TEAM") {
      await notifyActiveProjectMembers(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,
        roles:["LEARNER"],exceptUserId:context.user.id,
        title:"New project resource",body:"A resource was added to your project.",
        actionHref:"/learn/projects/"+scope.project.id+"?tab=resources",
      });
      }
      return resource;
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) throw error;
    throw mapResourceConstraint(error);
  }
}

export async function updateProjectResource(
  context: RequestContext,
  projectIdInput: string,
  resourceIdInput: string,
  rawInput: UpdateProjectResourceInput,
) {
  const scope =
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const input =
    updateProjectResourceInputSchema.parse(
      rawInput,
    );
  const resourceId =
    projectResourceIdSchema.parse(resourceIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update")
      .limit(1);

    if (!project) {
      throw new ProjectsServiceError("PROJECT_NOT_FOUND");
    }
    ensureMutableProject(project.status);
    await assertPersistedProjectMutationActor(tx,context,scope);

    const [resource] = await tx
      .select()
      .from(projectResources)
      .where(
        and(
          eq(projectResources.id, resourceId),
          eq(projectResources.projectId, scope.project.id),
        ),
      )
      .for("update")
      .limit(1);

    if (!resource) {
      throw new ProjectsServiceError(
        "PROJECT_RESOURCE_NOT_FOUND",
      );
    }
    if(resource.status==="ARCHIVED")throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
    // MEN-projects-meetings-R07: a stale editor must not overwrite a
    // resource changed while its form was open.
    if ((scope.access==="MENTOR" && !input.expectedUpdatedAt) ||
      (input.expectedUpdatedAt &&
       resource.updatedAt.getTime()!==new Date(input.expectedUpdatedAt).getTime()))
      throw new ProjectsServiceError("PROJECT_RESOURCE_STALE_VERSION");

    const merged =
      createProjectResourceInputSchema.parse({
        title: input.title ?? resource.title,
        description:
          input.description !== undefined
            ? input.description
            : resource.description,
        url:
          input.url !== undefined
            ? input.url
            : resource.url,
        required:
          input.required ?? resource.required,
        visibility: input.visibility ?? resource.visibility,
        resourceType: input.resourceType ?? resource.resourceType,
        status: input.status ?? resource.status,
        pinned: input.pinned ?? resource.pinned,
        accessNotes: input.accessNotes !== undefined ? input.accessNotes : resource.accessNotes,
        sprintId: input.sprintId !== undefined ? input.sprintId : resource.sprintId,
        taskId: input.taskId !== undefined ? input.taskId : resource.taskId,
      });

    if(merged.sprintId){
      const [associated]=await tx.select({id:projectSprints.id}).from(projectSprints)
        .where(and(eq(projectSprints.id,merged.sprintId),
          eq(projectSprints.projectId,scope.project.id))).limit(1);
      if(!associated)throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
    }
    if(merged.taskId){
      const [associated]=await tx.select({id:projectTasks.id,sprintId:projectTasks.sprintId})
        .from(projectTasks).where(and(eq(projectTasks.id,merged.taskId),
          eq(projectTasks.projectId,scope.project.id))).limit(1);
      if(!associated || (merged.sprintId && associated.sprintId!==merged.sprintId))
        throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
    }

    const [updated] = await tx
      .update(projectResources)
      .set({
        title: merged.title,
        description: merged.description ?? null,
        url: merged.url ?? null,
        required: merged.required ?? false,
        visibility: merged.visibility ?? "TEAM",
        resourceType: merged.resourceType ?? "LINK",
        status: merged.status ?? "ACTIVE",
        pinned: merged.pinned ?? false,
        accessNotes: merged.accessNotes ?? null,
        sprintId: merged.sprintId ?? null,
        taskId: merged.taskId ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectResources.id, resource.id),
          eq(projectResources.projectId, scope.project.id),
          eq(projectResources.status, resource.status),
        ),
      )
      .returning();

    if (!updated) {
      throw new ProjectsServiceError(
        "PROJECT_RESOURCE_NOT_FOUND",
      );
    }

    const event=await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("UPDATED",{
      projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
    },updated,randomUUID()));
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:["MENTOR"],exceptUserId:context.user.id,
      title:"Project resource updated",body:"A project resource has changed.",
      actionHref:"/mentor/projects/"+scope.project.id+"?tab=resources",
    });
    if(updated.visibility==="TEAM") {
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:["LEARNER"],exceptUserId:context.user.id,
      title:"Project resource updated",body:"A project resource has changed.",
      actionHref:"/learn/projects/"+scope.project.id+"?tab=resources",
    });
    }
    return updated;
  });
}

export async function archiveProjectResource(
  context: RequestContext,
  projectIdInput: string,
  resourceIdInput: string,
  rawInput: unknown = {},
) {
  const scope =
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const input=archiveProjectResourceInputSchema.parse(rawInput);
  if (scope.access==="MENTOR" && !input.expectedUpdatedAt)
    throw new ProjectsServiceError("PROJECT_RESOURCE_STALE_VERSION");
  const resourceId =
    projectResourceIdSchema.parse(resourceIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update")
      .limit(1);

    if (!project) {
      throw new ProjectsServiceError("PROJECT_NOT_FOUND");
    }
    ensureMutableProject(project.status);
    await assertPersistedProjectMutationActor(tx,context,scope);

    const [resource] = await tx
      .select({ id: projectResources.id, updatedAt:projectResources.updatedAt })
      .from(projectResources)
      .where(
        and(
          eq(projectResources.id, resourceId),
          eq(projectResources.projectId, scope.project.id),
          eq(projectResources.status, "ACTIVE"),
        ),
      )
      .for("update")
      .limit(1);

    if (!resource) {
      throw new ProjectsServiceError(
        "PROJECT_RESOURCE_NOT_FOUND",
      );
    }
    if (input.expectedUpdatedAt && resource.updatedAt.getTime()!==
      new Date(input.expectedUpdatedAt).getTime())
      throw new ProjectsServiceError("PROJECT_RESOURCE_STALE_VERSION");

    const [archived] = await tx
      .update(projectResources)
      .set({
        status: "ARCHIVED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectResources.id, resource.id),
          eq(projectResources.projectId, scope.project.id),
          eq(projectResources.status, "ACTIVE"),
        ),
      )
      .returning();

    if (!archived) {
      throw new ProjectsServiceError(
        "PROJECT_RESOURCE_NOT_FOUND",
      );
    }

    await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("ARCHIVED",{
      projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
    },archived));
    return archived;
  });
}

/** MEN-projects-meetings-56: reorder ACTIVE resources without colliding with
 * unique positions occupied by archived records. All IDs are scoped to one
 * authorized project; a stale/partial array cannot silently lose an item.
 */
export const projectResourceReorderSchema=z.strictObject({
  orderIds:z.array(z.string().uuid()).min(1).max(250).refine(
    ids=>new Set(ids).size===ids.length,{message:"Resource order contains duplicates"},
  ),
  expectedOrderIds:z.array(z.string().uuid()).min(1).max(250).optional(),
});
export async function reorderProjectResources(
  context:RequestContext,projectIdInput:string,rawInput:unknown,
){
  const scope=await requireProjectLifecycleMutationAccess(context,projectIdInput);
  const {orderIds,expectedOrderIds}=projectResourceReorderSchema.parse(rawInput);
  return getDb().transaction(async tx=>{
    const [project]=await tx.select({status:projectInstances.status})
      .from(projectInstances).where(and(eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update").limit(1);
    if(!project)throw new ProjectsServiceError("PROJECT_NOT_FOUND");
    ensureMutableProject(project.status);
    await assertPersistedProjectMutationActor(tx,context,scope);
    const all=await tx.select({id:projectResources.id,title:projectResources.title,
      sequence:projectResources.sequence,status:projectResources.status}).from(projectResources)
      .where(eq(projectResources.projectId,scope.project.id))
      .orderBy(asc(projectResources.sequence)).for("update");
    const active=all.filter(item=>item.status==="ACTIVE");
    if(active.length!==orderIds.length||active.length>250 ||
        active.some(row=>!orderIds.includes(row.id))){
      throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
    }
    const old=active.map(row=>row.id);
    if(old.every((id,i)=>id===orderIds[i]))return {changed:false,count:active.length};
    // A complete ID set alone cannot distinguish a concurrent reorder.
    // Require the exact order the editor originally loaded.
    if(!expectedOrderIds||expectedOrderIds.length!==old.length||
       expectedOrderIds.some((id,i)=>id!==old[i])){
      throw new ProjectsServiceError("PROJECT_RESOURCE_STALE_VERSION");
    }
    const maxSequence=Math.max(-1,...all.map(item=>item.sequence));
    if(!Number.isSafeInteger(maxSequence)||maxSequence>2147483647-active.length-1){
      throw new ProjectsServiceError("PROJECT_RESOURCE_SEQUENCE_CONFLICT");
    }
    // Phase 1 reserves disjoint positive sequence values. The check constraint
    // disallows negative sentinels, and archived positions must never move.
    for(let i=0;i<orderIds.length;i++){
      await tx.update(projectResources).set({sequence:maxSequence+1+i})
        .where(and(eq(projectResources.id,orderIds[i]!),eq(projectResources.projectId,scope.project.id)));
    }
    // Phase 2 fills only the ACTIVE positions vacated above.
    for(let i=0;i<orderIds.length;i++){
      await tx.update(projectResources)
        .set({sequence:active[i]!.sequence,updatedAt:new Date()})
        .where(and(eq(projectResources.id,orderIds[i]!),eq(projectResources.projectId,scope.project.id)));
    }
    for(let index=0;index<orderIds.length;index++){
      const item=active.find(row=>row.id===orderIds[index]);
      if(!item||item.sequence===active[index]!.sequence)continue;
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_UPDATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_resource",subjectId:item.id,subjectLabel:item.title,
        summary:"Project resource order changed",
        metadata:{projectId:scope.project.id,resourceId:item.id,
          previousSequence:item.sequence,nextSequence:active[index]!.sequence},
        groupKey:"project:"+scope.project.id+":resources",
      });
    }
    return {changed:true,count:active.length};
  });
}
