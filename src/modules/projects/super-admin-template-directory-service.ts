import "server-only";
import { and, asc, count, eq, ilike, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, projectTemplates, projectTemplateCollegeAssignments } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { templateDirectoryQuerySchema,templateDirectoryPages,TEMPLATE_DIRECTORY_PAGE_SIZE } from "./super-admin-template-directory-model";
/** Scope affects assignment counts, not global template metadata. No assignments from foreign colleges are returned. */
export async function listSuperAdminTemplateDirectory(context:RequestContext,raw:unknown) {
 requirePermission(context,"project-template.read");
 const query=templateDirectoryQuerySchema.parse(raw);
 const conditions=and(
  query.status==="ALL"?undefined:eq(projectTemplates.status,query.status),
  query.q?ilike(projectTemplates.title,"%"+query.q.replace(/[\\%_]/g,"\\$&")+"%"):undefined,
 );
 const db=getDb();
 const [totals,items]=await Promise.all([
  db.select({total:count()}).from(projectTemplates).where(conditions),
  db.select({id:projectTemplates.id,title:projectTemplates.title,slug:projectTemplates.slug,
   status:projectTemplates.status,summary:projectTemplates.summary,
   currentVersion:projectTemplates.currentVersion,publishedVersion:projectTemplates.publishedVersion})
   .from(projectTemplates).where(conditions)
   .orderBy(asc(projectTemplates.title),asc(projectTemplates.id))
   .limit(TEMPLATE_DIRECTORY_PAGE_SIZE).offset((query.page-1)*TEMPLATE_DIRECTORY_PAGE_SIZE),
 ]);
 const selected=context.adminScope;
 const counts=items.length?await db.select({
  templateId:projectTemplateCollegeAssignments.templateId,
  activeAssignments:count(),
 }).from(projectTemplateCollegeAssignments)
  .innerJoin(colleges,eq(colleges.id,projectTemplateCollegeAssignments.collegeId))
  .where(and(inArray(projectTemplateCollegeAssignments.templateId,items.map(x=>x.id)),
   isNull(projectTemplateCollegeAssignments.revokedAt),
   selected?.collegeId?eq(colleges.id,selected.collegeId):undefined,
   !selected?.collegeId&&selected?.organizationId?eq(colleges.organizationId,selected.organizationId):undefined,
  )).groupBy(projectTemplateCollegeAssignments.templateId):[];
 const byId=new Map(counts.map(row=>[row.templateId,row.activeAssignments]));
 const total=totals[0]?.total??0;
 return {query,items:items.map(item=>({...item,activeAssignments:byId.get(item.id)??0})),
  total,totalPages:templateDirectoryPages(total),assignmentScope:selected?.collegeId?"COLLEGE" as const:
  selected?.organizationId?"ORGANIZATION" as const:"GLOBAL" as const};
}
