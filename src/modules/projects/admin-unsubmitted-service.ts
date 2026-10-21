import "server-only";
import {z} from "zod";
import {and,asc,count,eq,ilike,ne,notExists,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectSubmissions} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {getProjectAdminCollegeId} from "./admin-college-scope";
import {ProjectsServiceError} from "./errors";
import {loadProjectCollegeScope} from "./scope";
import {adminUnsubmittedQuerySchema,adminUnsubmittedLiteralSearchPattern} from "./admin-unsubmitted-query-model";
/** SA-placements-projects-69: scoped, paged workspaces with no submission versions. */
export async function listProjectAdminUnsubmitted(context:RequestContext,collegeId:string,raw:unknown){
 const q=adminUnsubmittedQuerySchema.parse(raw);
 // Reject a forged college before resolving its existence or reading activity.
 if(getProjectAdminCollegeId(context)!==collegeId)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const college=await loadProjectCollegeScope(collegeId);
 requirePermission(context,"projects.manage",{organizationId:college.organizationId,collegeId:college.id});
 // A request-context role snapshot may have expired after it was issued.
 // Keep persisted role locks for this entire count/page read, including empty results.
 return getDb().transaction(async db=>{
  await assertPersistedPlatformPermission(db,context,"projects.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
 const searchPattern=adminUnsubmittedLiteralSearchPattern(q.q??"");
 const focus=q.focusedProjectId;
 const focusUuid=focus&&z.string().uuid().safeParse(focus).success?focus:null;
 const focusLegacy=focus&&/^[0-9]+$/.test(focus)&&Number.isSafeInteger(Number(focus))&&Number(focus)>0?Number(focus):null;
 const focusCondition=focus?or(
    focusUuid?eq(projectInstances.id,focusUuid):undefined,
    eq(projectInstances.slug,focus),
    focusLegacy!==null?eq(projectInstances.legacyProjectId,focusLegacy):undefined,
 ):undefined;
 // The subquery must reference the parent project's qualified ID. Plain
 // column interpolation inside nested SQL can resolve to an inner "id".
 const parentProjectId=sql.raw('"project_instances"."id"');
 const where=and(eq(projectInstances.collegeId,college.id),
  focusCondition,
  ne(projectInstances.status,"ARCHIVED"),
  q.status?eq(projectInstances.status,q.status):undefined,
  notExists(db.select({id:projectSubmissions.id}).from(projectSubmissions)
   .where(eq(projectSubmissions.projectId,parentProjectId))),
  q.q?or(ilike(projectInstances.title,searchPattern),
   ilike(projectInstances.slug,searchPattern)):undefined);
 const [totalRows,items]=await Promise.all([
  db.select({value:count()}).from(projectInstances).where(where),
  db.select({id:projectInstances.id,title:projectInstances.title,status:projectInstances.status,
   progressPercent:projectInstances.progressPercent,updatedAt:projectInstances.updatedAt,
   mentorName:sql<string|null>`(select u.display_name from project_members pm
     join college_memberships cm on cm.id=pm.membership_id
     join users u on u.id=cm.user_id
     where pm.project_id=${projectInstances.id} and pm.role='MENTOR'
       and pm.ended_at is null and cm.college_id=${college.id}
       and cm.status='ACTIVE'
     order by pm.is_primary desc,pm.created_at asc limit 1)`,
   blocker:projectInstances.blocker}).from(projectInstances).where(where)
   .orderBy(asc(projectInstances.title),asc(projectInstances.id))
   .limit(q.pageSize).offset((q.page-1)*q.pageSize),
 ]);
 const total=Number(totalRows[0]?.value??0);
 return {items,total,page:q.page,totalPages:Math.max(1,Math.ceil(total/q.pageSize))};
 });
}
