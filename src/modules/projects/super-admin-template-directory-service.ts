import "server-only";
import { and, or, asc, count, eq, ilike, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, projectTemplates, projectTemplateVersions, projectTemplateCollegeAssignments } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { templateDirectoryQuerySchema,templateDirectoryPages,TEMPLATE_DIRECTORY_PAGE_SIZE } from "./super-admin-template-directory-model";
import {countTemplateBlueprintItems} from "./template-subview-model";
/** Scope affects assignment counts, not global template metadata. No assignments from foreign colleges are returned. */
export async function listSuperAdminTemplateDirectory(context:RequestContext,raw:unknown) {
 requirePermission(context,"project-template.read");
 const query=templateDirectoryQuerySchema.parse(raw);
 const conditions=and(
  query.status==="ALL"?undefined:eq(projectTemplates.status,query.status),
  query.q?or(
   ilike(projectTemplates.title,"%"+query.q.replace(/[\\%_]/g,"\\$&")+"%"),
   ilike(projectTemplates.slug,"%"+query.q.replace(/[\\%_]/g,"\\$&")+"%")):undefined,
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
 const versions=items.length?await db.select({templateId:projectTemplateVersions.templateId,
   version:projectTemplateVersions.version,blueprint:projectTemplateVersions.blueprint})
   // Only the current snapshot is used for card counts. Fetching every
   // historical JSON blueprint made this 20-template page unbounded as
   // administrators revised templates over successive terms.
   .from(projectTemplateVersions)
   .innerJoin(projectTemplates,and(
    eq(projectTemplateVersions.templateId,projectTemplates.id),
    eq(projectTemplateVersions.version,projectTemplates.currentVersion),
   ))
   .where(inArray(projectTemplates.id,items.map(x=>x.id))):[];
 const versionByTemplate=new Map(versions.map(v=>[v.templateId+":"+v.version,v.blueprint]));
 const byId=new Map(counts.map(row=>[row.templateId,row.activeAssignments]));
 const total=totals[0]?.total??0;
 return {query,items:items.map(item=>({...item,activeAssignments:byId.get(item.id)??0,
  sectionCounts:versionByTemplate.has(item.id+":"+item.currentVersion)?
    countTemplateBlueprintItems(versionByTemplate.get(item.id+":"+item.currentVersion)!):null})),
  total,totalPages:templateDirectoryPages(total),assignmentScope:selected?.collegeId?"COLLEGE" as const:
  selected?.organizationId?"ORGANIZATION" as const:"GLOBAL" as const};
}
