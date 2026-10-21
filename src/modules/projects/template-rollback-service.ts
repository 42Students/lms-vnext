import "server-only";
import {and,eq,isNull,count,asc} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectTemplates,projectTemplateVersions,projectInstances,
 projectTemplateCollegeAssignments} from "@/db/schema";
import {requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import type {RequestContext} from "@/modules/identity/context";
import {ProjectsServiceError} from "./errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {projectTemplateBlueprintSchema} from "./validation";
const rollbackSchema=z.strictObject({
 versionId:z.string().uuid(),
 expectedTemplateVersion:z.number().int().min(1),
 confirmed:z.literal(true),
 expectedAssignedCollegeCount:z.number().int().min(0).optional(),
 expectedPinnedWorkspaceCount:z.number().int().min(0).optional(),
});

/** Read-only blast-radius preview. No workspaces are mutated on content
 * rollback: current project instances are pinned to their materialized
 * version, and assigned colleges continue using the published pointer.
 */
export async function previewProjectTemplateRollbackImpact(
 context:RequestContext,templateIdInput:string,
){
 requirePermission(context,"project-template.manage");
 const templateId=z.string().uuid().parse(templateIdInput);
 return getDb().transaction(async tx=>{
  const [template]=await tx.select({
   id:projectTemplates.id,status:projectTemplates.status,
   currentVersion:projectTemplates.currentVersion,
   publishedVersion:projectTemplates.publishedVersion,
  }).from(projectTemplates).where(eq(projectTemplates.id,templateId)).limit(1);
  if(!template)throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
  await assertPersistedPlatformPermission(tx,context,"project-template.manage");
  const [assignmentTotals,instanceTotals,sampleWorkspaces]=await Promise.all([
   tx.select({total:count()}).from(projectTemplateCollegeAssignments).where(and(
    eq(projectTemplateCollegeAssignments.templateId,templateId),
    isNull(projectTemplateCollegeAssignments.revokedAt),
   )),
   tx.select({total:count()}).from(projectInstances)
    .where(eq(projectInstances.templateId,templateId)),
   tx.select({id:projectInstances.id,title:projectInstances.title})
    .from(projectInstances).where(eq(projectInstances.templateId,templateId))
    .orderBy(asc(projectInstances.title),asc(projectInstances.id)).limit(5),
  ]);
  return {
   expectedTemplateVersion:template.currentVersion,
   assignedCollegeCount:Number(assignmentTotals[0]?.total??0),
   pinnedWorkspaceCount:Number(instanceTotals[0]?.total??0),
   sampleWorkspaces,
   existingWorkspacesRewritten:0,
   publishedVersionUnchanged:template.publishedVersion,
   lifecycleUnchanged:template.status,
  };
 });
}

/** Restore a prior snapshot as a NEW version. Existing workspaces and published version remain unchanged. */
export async function rollbackProjectTemplate(context:RequestContext,templateIdInput:string,raw:unknown){
 requirePermission(context,"project-template.manage");
 const templateId=z.string().uuid().parse(templateIdInput);
 const input=rollbackSchema.parse(raw);
 return getDb().transaction(async tx=>{
  const [template]=await tx.select().from(projectTemplates)
    .where(eq(projectTemplates.id,templateId)).for("update").limit(1);
  if(!template)throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
  // Session roles may have been revoked since this request authenticated.
  // Re-check the persisted Super Admin status under SHARE locks inside
  // this same parent-row-locked transaction before inserting a new version.
  await assertPersistedPlatformPermission(tx,context,"project-template.manage");
  if(template.status==="ARCHIVED"||template.currentVersion!==input.expectedTemplateVersion)
   throw new ProjectsServiceError("PROJECT_TEMPLATE_STALE_VERSION");
  const [prior]=await tx.select().from(projectTemplateVersions)
    .where(and(eq(projectTemplateVersions.templateId,template.id),
      eq(projectTemplateVersions.id,input.versionId))).limit(1);
  if(!prior)throw new ProjectsServiceError("PROJECT_TEMPLATE_VERSION_NOT_FOUND");
  if(prior.version===template.currentVersion)throw new ProjectsServiceError("PROJECT_TEMPLATE_STALE_VERSION");
  const [assigned,pinned]=await Promise.all([
    tx.select({total:count()}).from(projectTemplateCollegeAssignments)
      .where(and(eq(projectTemplateCollegeAssignments.templateId,templateId),
        isNull(projectTemplateCollegeAssignments.revokedAt))),
    tx.select({total:count()}).from(projectInstances)
      .where(eq(projectInstances.templateId,templateId)),
  ]);
  const assignedCollegeCount=Number(assigned[0]?.total??0);
  const pinnedWorkspaceCount=Number(pinned[0]?.total??0);
  if((input.expectedAssignedCollegeCount!==undefined&&
       input.expectedAssignedCollegeCount!==assignedCollegeCount)||
     (input.expectedPinnedWorkspaceCount!==undefined&&
       input.expectedPinnedWorkspaceCount!==pinnedWorkspaceCount))
    throw new ProjectsServiceError("PROJECT_TEMPLATE_STALE_VERSION");
  const blueprint=projectTemplateBlueprintSchema.parse(prior.blueprint);
  const now=new Date();
  const [updated]=await tx.update(projectTemplates).set({
    title:prior.title,summary:prior.summary,currentVersion:template.currentVersion+1,updatedAt:now,
  }).where(and(eq(projectTemplates.id,template.id),
    eq(projectTemplates.currentVersion,input.expectedTemplateVersion))).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_TEMPLATE_STALE_VERSION");
  const [version]=await tx.insert(projectTemplateVersions).values({
    templateId:template.id,version:updated.currentVersion,
    title:prior.title,summary:prior.summary,blueprint,
    changeNote:"Rolled back to version "+prior.version,
    createdByUserId:context.user.id,
  }).returning();
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_ROLLED_BACK,
   subjectType:"project_template",subjectId:template.id,subjectLabel:updated.title,
   summary:"Super Admin rolled back a project template version",
   metadata:{restoredFromVersion:prior.version,previousCurrentVersion:template.currentVersion,
    newCurrentVersion:updated.currentVersion,publishedVersionUnchanged:template.publishedVersion,
    existingWorkspacesUnchanged:true,assignedCollegeCount,pinnedWorkspaceCount,rollbackSemantics:"CONTENT_VERSION_ONLY"},
   groupKey:"template:"+template.id,
  });
  return {template:updated,version,restoredFromVersion:prior.version,
    impact:{existingWorkspaces:"unchanged",publishedVersion:template.publishedVersion,
      currentVersion:updated.currentVersion,assignedCollegeCount,pinnedWorkspaceCount,lifecycleUnchanged:template.status}};
 });
}
