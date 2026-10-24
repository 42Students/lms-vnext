import {
  and,
  asc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {notifyActiveProjectMembers} from "./project-notification-service";
import {projectResourceAuditInput} from "./mentor-resource-audit-model";
import {isArchivableProjectResourceStatus,isArchivedResourceRestoreOnly} from "./mentor-resource-state-transition-model";
import {randomUUID} from "node:crypto";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {z} from "zod";
import {
  projectInstances,
  projectResources,
  projectSprints,
  projectTasks,
  projectMembers,
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
  if (["project_resources_project_sequence_uq",
       "project_resources_project_key_uq"].includes(postgresConstraintName(error)??"")) {
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
      if(scope.access==="LEARNER"){
        // A learner may have been removed between the route's read check
        // and this transaction. Verify persisted account, role and project
        // grant under SHARE locks before writing a private resource.
        const persisted=await assertPersistedPlatformPermission(tx,context,"projects.read",{
          collegeId:scope.collegeId,organizationId:scope.organizationId,
        });
        const membershipId=context.membership?.id;
        if(!membershipId||persisted.membership?.id!==membershipId)
          throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
        const [activeMember]=await tx.select({id:projectMembers.id})
          .from(projectMembers).where(and(
            eq(projectMembers.projectId,scope.project.id),
            eq(projectMembers.membershipId,membershipId),
            eq(projectMembers.role,"LEARNER"),
            eq(projectMembers.roleKind,"LEARNER"),
            eq(projectMembers.canMutate,true),
            isNull(projectMembers.endedAt),
          )).for("share").limit(1);
        if(!activeMember)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
      }
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

      // Locking the parent project above serializes concurrent creates made
      // through this service; do not derive sequence or keys outside that lock.
      // Legacy resource keys must remain stable even for duplicate titles or
      // resources imported before a key was assigned.
      const existing = await tx.select({
        sequence:projectResources.sequence,templateKey:projectResources.templateKey,
      }).from(projectResources).where(eq(projectResources.projectId,scope.project.id));
      const latestSequence=existing.reduce((max,row)=>Math.max(max,row.sequence),-1);
      if(latestSequence>=2147483647)
        throw new ProjectsServiceError("PROJECT_RESOURCE_SEQUENCE_CONFLICT");
      const base=input.title.toLocaleLowerCase("en-IN").normalize("NFKD")
        .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
        .replace(/^-|-$/g,"").slice(0,48).replace(/-$/,"")||"resource";
      const usedKeys=new Set(existing.map(row=>row.templateKey).filter(
        (key):key is string=>typeof key==="string"));
      let templateKey=base;
      for(let suffix=2;usedKeys.has(templateKey);suffix++){
        // Unique sequence and resource keys are stable, within varchar(64).
        if(suffix>existing.length+2)
          throw new ProjectsServiceError("PROJECT_RESOURCE_SEQUENCE_CONFLICT");
        templateKey=base.slice(0,64-String(suffix).length-1)+"-"+suffix;
      }

      const [resource] = await tx
        .insert(projectResources)
        .values({
          projectId: scope.project.id,
          templateKey,
          title: input.title,
          description: input.description ?? null,
          url: input.url ?? null,
          required: input.required ?? false,
          visibility: input.visibility ?? "TEAM",
          resourceType: input.resourceType ?? (input.url ? "LINK" : "NOTE"),
          legacyResourceKind:scope.access==="LEARNER"?null:input.legacyResourceKind??null,
          status: scope.access==="LEARNER"?"ACTIVE":input.status??"ACTIVE",
          pinned: scope.access==="LEARNER"?false:input.pinned??false,
          accessNotes: scope.access==="LEARNER"?null:input.accessNotes??null,
          sprintId: scope.access==="LEARNER"?null:input.sprintId??null,
          taskId: scope.access==="LEARNER"?null:input.taskId??null,
          sequence: latestSequence + 1,
        })
        .returning();

      if(!resource)throw new ProjectsServiceError("PROJECT_RESOURCE_NOT_FOUND");
      // The append-only project-resource audit event is written synchronously
      // in the same transaction as this resource, never in a deferred job.
      const event=await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("CREATED",{
        projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
      },resource,undefined,scope.access==="LEARNER"?"LEARNER":
         scope.access==="MENTOR"?"MENTOR":"ADMIN",{before:null,after:resource}));
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
    if(resource.status==="ARCHIVED"){
      // An archived resource can be restored, but it cannot be modified while
      // archived or revived with an old version token.
      if(!input.expectedUpdatedAt)
        throw new ProjectsServiceError("PROJECT_RESOURCE_STALE_VERSION");
      if(!isArchivedResourceRestoreOnly(input))
        throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
    }
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
        legacyResourceKind:input.legacyResourceKind!==undefined?
          input.legacyResourceKind:resource.legacyResourceKind,
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
        legacyResourceKind:merged.legacyResourceKind??null,
        status: merged.status ?? "ACTIVE",
        pinned: merged.pinned ?? false,
        accessNotes: merged.accessNotes ?? null,
        sprintId: merged.sprintId ?? null,
        taskId: merged.taskId ?? null,
        updatedAt: new Date(Math.max(Date.now(), resource.updatedAt.getTime() + 1)),
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

    // Dedicated audit before/after snapshots share this SQL transaction.
    const event=await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("UPDATED",{
      projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
    },updated,randomUUID(),undefined,{before:resource,after:updated}));
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
      .select()
      .from(projectResources)
      .where(
        and(
          eq(projectResources.id, resourceId),
          eq(projectResources.projectId, scope.project.id),
          inArray(projectResources.status, ["ACTIVE", "DRAFT"]),
        ),
      )
      .for("update")
      .limit(1);

    if (!resource) {
      throw new ProjectsServiceError(
        "PROJECT_RESOURCE_NOT_FOUND",
      );
    }
    if (!isArchivableProjectResourceStatus(resource.status))
      throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
    if (input.expectedUpdatedAt && resource.updatedAt.getTime()!==
      new Date(input.expectedUpdatedAt).getTime())
      throw new ProjectsServiceError("PROJECT_RESOURCE_STALE_VERSION");

    const [archived] = await tx
      .update(projectResources)
      .set({
        status: "ARCHIVED",
        updatedAt: new Date(Math.max(Date.now(), resource.updatedAt.getTime() + 1)),
      })
      .where(
        and(
          eq(projectResources.id, resource.id),
          eq(projectResources.projectId, scope.project.id),
          eq(projectResources.status, resource.status),
        ),
      )
      .returning();

    if (!archived) {
      throw new ProjectsServiceError(
        "PROJECT_RESOURCE_NOT_FOUND",
      );
    }

    // The tombstone and append-only resource audit commit atomically.
    await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("ARCHIVED",{
      projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
    },archived,undefined,undefined,{before:resource,after:archived}));
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
    // The reorder is one atomic action even when multiple rows move:
    // publish a single audit event after both sequence phases complete.
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project",subjectId:scope.project.id,
      subjectLabel:"Project resources",
      summary:"Project resource order changed",
      metadata:{projectId:scope.project.id,previousOrder:old,nextOrder:orderIds,
        // Every displaced item is recoverable from the append-only event.
        // Archived items never move, so their history is unaffected.
        moves:orderIds.flatMap((resourceId,toIndex)=>{
          const fromIndex=old.indexOf(resourceId);
          if(fromIndex===toIndex)return [];
          return [{resourceId,fromIndex,toIndex,
            previousSequence:active[fromIndex]?.sequence??null,
            nextSequence:active[toIndex]?.sequence??null}];
        }),
      },
      groupKey:"project:"+scope.project.id+":resources",
    });
    return {changed:true,count:active.length};
  });
}
