import "server-only";

import { and, asc, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships,projectInstances,projectMembers,users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { getProjectAdminCollegeId } from "./admin-college-scope";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { loadProjectCollegeScope } from "./scope";
import { requireProjectManageAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { projectArchiveTokenMatches } from "./instance-archive-model";
import { projectSoftDeleteInputSchema } from "./project-soft-delete-model";

/** Deleted workspaces are retained for recovery and audit, never hard-deleted. */
export async function listSoftDeletedProjectWorkspaces(context: RequestContext, collegeId: string) {
  const college = await loadProjectCollegeScope(collegeId);
  requirePermission(context, "projects.manage", {
    collegeId: college.id, organizationId: college.organizationId,
  });
  return getDb().select({
    id: projectInstances.id, title: projectInstances.title,
    status: projectInstances.status, deletedAt: projectInstances.deletedAt,
    updatedAt: projectInstances.updatedAt,
  }).from(projectInstances).where(and(
    eq(projectInstances.collegeId, college.id),
    isNotNull(projectInstances.deletedAt),
  )).orderBy(asc(projectInstances.title), asc(projectInstances.id)).limit(200);
}

/** Page-specific deleted workspace listing; 1-based presentation page maps to
 * 0-based SQL offset, matching the old LMS deleted-collection contract.
 * Unlike the compatibility 200-row read, this query has an exact count and
 * former-mentor fallback on the authorized selected college.
 */
const deletedPageSchema=z.strictObject({
 page:z.number().int().min(1).max(100000),
 pageSize:z.union([z.literal(10),z.literal(20),z.literal(50),z.literal(100)]),
});
export async function listPaginatedDeletedProjectWorkspaces(
 context:RequestContext,collegeId:string,raw:{page:number;pageSize:number},
){
 const query=deletedPageSchema.parse(raw);
 if(getProjectAdminCollegeId(context)!==collegeId)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const college=await loadProjectCollegeScope(collegeId);
 requirePermission(context,"projects.manage",{collegeId:college.id,organizationId:college.organizationId});
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"projects.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const where=and(eq(projectInstances.collegeId,college.id),isNotNull(projectInstances.deletedAt));
  const [totalRows,projects]=await Promise.all([
   tx.select({value:count()}).from(projectInstances).where(where),
   tx.select({id:projectInstances.id,title:projectInstances.title,slug:projectInstances.slug,
    updatedAt:projectInstances.updatedAt,deletedAt:projectInstances.deletedAt,
    status:projectInstances.status})
    .from(projectInstances).where(where)
    .orderBy(asc(projectInstances.title),asc(projectInstances.id))
    .limit(query.pageSize).offset((query.page-1)*query.pageSize),
  ]);
  const total=Number(totalRows[0]?.value??0);
  const ids=projects.map(project=>project.id);
  const mentors=ids.length?await tx.select({
   projectId:projectMembers.projectId,
   displayName:users.displayName,
   primary:projectMembers.isPrimary,
   endedAt:projectMembers.endedAt,
  }).from(projectMembers)
   .innerJoin(collegeMemberships,and(
    eq(collegeMemberships.id,projectMembers.membershipId),
    eq(collegeMemberships.collegeId,college.id),
   ))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(inArray(projectMembers.projectId,ids),eq(projectMembers.role,"MENTOR")))
   .orderBy(desc(projectMembers.isPrimary),asc(projectMembers.endedAt)):[]; 
  const mentorByProject=new Map<string,{name:string;former:boolean}>();
  for(const row of mentors){
   if(mentorByProject.has(row.projectId))continue;
   mentorByProject.set(row.projectId,{
    name:row.displayName?.trim()||"—",former:Boolean(row.endedAt),
   });
  }
  return {
   items:projects.map(project=>({
    ...project,
    title:project.title?.trim()||project.slug?.trim()||"Workspace",
    mentorName:mentorByProject.get(project.id)?.name??null,
    mentorFormer:mentorByProject.get(project.id)?.former??true,
   })),
   total,page:query.page,pageSize:query.pageSize,
   totalPages:Math.max(1,Math.ceil(total/query.pageSize)),
  };
 });
}

export async function changeProjectSoftDeleteState(
  context: RequestContext,
  projectId: string,
  raw: unknown,
  restore: boolean,
) {
  const input = projectSoftDeleteInputSchema.parse(raw);
  const scope = await requireProjectManageAccess(context, projectId, { includeDeleted: restore });
  return getDb().transaction(async tx => {
    const [project] = await tx.select().from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId, scope.collegeId)))
      .for("update").limit(1);
    if (!project) throw new ProjectsServiceError("PROJECT_NOT_FOUND");
    await assertPersistedPlatformPermission(tx, context, "projects.manage", {
      collegeId: scope.collegeId, organizationId: scope.organizationId,
    });
    if (Boolean(project.deletedAt) !== restore) {
      // Idempotent after authorizing the live actor; no duplicate audit event.
      return { changed: false, project };
    }
    if (!projectArchiveTokenMatches(project.updatedAt, input.expectedUpdatedAt)) {
      throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    }
    const now = new Date(Math.max(Date.now(), project.updatedAt.getTime()) + 1);
    const [updated] = await tx.update(projectInstances).set(
      restore
        ? { deletedAt: null, updatedAt: now }
        : { deletedAt: now, status: "ARCHIVED",
            archivedAt: project.archivedAt ?? now, updatedAt: now },
    ).where(and(eq(projectInstances.id, project.id),
      eq(projectInstances.collegeId, scope.collegeId))).returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_NOT_FOUND");
    await recordActivityEventInTransaction(tx, context, {
      eventType: restore
        ? ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_RESTORED
        : ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_DELETED,
      collegeId: scope.collegeId, organizationId: scope.organizationId,
      subjectType: "project", subjectId: project.id, subjectLabel: project.title,
      summary: restore ? "Deleted workspace restored" : "Workspace moved to Deleted workspaces",
      metadata: { projectId: project.id, previousStatus: project.status,
        previousDeletedAt: project.deletedAt?.toISOString() ?? null,
        status: updated.status, softDeleted: Boolean(updated.deletedAt) },
      groupKey: "project:" + project.id,
      dedupeKey: "project:soft-delete:" + project.id + ":" + now.toISOString(),
    });
    return { changed: true, project: updated };
  });
}
