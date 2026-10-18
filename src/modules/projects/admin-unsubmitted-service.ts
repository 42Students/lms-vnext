import "server-only";
import {and,asc,count,eq,ilike,ne,notExists,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectSubmissions} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {loadProjectCollegeScope} from "./scope";
import {adminUnsubmittedQuerySchema,adminUnsubmittedLiteralSearchPattern} from "./admin-unsubmitted-query-model";
/** SA-placements-projects-69: scoped, paged workspaces with no submission versions. */
export async function listProjectAdminUnsubmitted(context:RequestContext,collegeId:string,raw:unknown){
 const q=adminUnsubmittedQuerySchema.parse(raw),college=await loadProjectCollegeScope(collegeId);
 requirePermission(context,"projects.manage",{organizationId:college.organizationId,collegeId:college.id});
 const db=getDb();
 const searchPattern=adminUnsubmittedLiteralSearchPattern(q.q??"");
 const where=and(eq(projectInstances.collegeId,college.id),
  ne(projectInstances.status,"ARCHIVED"),
  q.status?eq(projectInstances.status,q.status):undefined,
  notExists(db.select({id:projectSubmissions.id}).from(projectSubmissions)
   .where(eq(projectSubmissions.projectId,projectInstances.id))),
  q.q?or(ilike(projectInstances.title,searchPattern),
   ilike(projectInstances.slug,searchPattern)):undefined);
 const [totalRows,items]=await Promise.all([
  db.select({value:count()}).from(projectInstances).where(where),
  db.select({id:projectInstances.id,title:projectInstances.title,status:projectInstances.status,
   progressPercent:projectInstances.progressPercent,updatedAt:projectInstances.updatedAt,
   blocker:projectInstances.blocker}).from(projectInstances).where(where)
   .orderBy(asc(projectInstances.title),asc(projectInstances.id))
   .limit(q.pageSize).offset((q.page-1)*q.pageSize),
 ]);
 const total=Number(totalRows[0]?.value??0);
 return {items,total,page:q.page,totalPages:Math.max(1,Math.ceil(total/q.pageSize))};
}
