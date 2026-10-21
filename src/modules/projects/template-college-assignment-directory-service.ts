import "server-only";
import {and,asc,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {colleges,projectTemplates,projectTemplateCollegeAssignments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";

/**
 * Legacy ProjectTemplateCollege findByTemplateId/findByCollegeId read parity.
 * Active = revokedAt IS NULL; a repeat assignment creates a new historic
 * row, never makes a revoked grant visible. UUIDs replace legacy integer IDs.
 * Legacy createdAt => assignedAt, updatedAt => revokedAt ?? assignedAt,
 * isDeleted => revokedAt !== null; historic null assignedBy is attributed to
 * a designated system/import actor before writing (FK remains NOT NULL).
 * Revocation replaces old hard deletes while preserving audit history.
 */
function selectedScope(context:RequestContext){
 const selected=context.adminScope;
 return and(
  selected?.collegeId?eq(colleges.id,selected.collegeId):undefined,
  !selected?.collegeId&&selected?.organizationId?
   eq(colleges.organizationId,selected.organizationId):undefined,
 );
}

export async function listTemplateAssignedColleges(
 context:RequestContext,rawTemplateId:string,includeHistory=false,
){
 requirePermission(context,"project-template.read");
 const templateId=z.string().uuid().parse(rawTemplateId);
 const rows=await getDb().select({
  id:projectTemplateCollegeAssignments.id,
  collegeId:colleges.id,collegeName:colleges.name,
  templateVersionId:projectTemplateCollegeAssignments.templateVersionId,
  assignedAt:projectTemplateCollegeAssignments.assignedAt,
  revokedAt:projectTemplateCollegeAssignments.revokedAt,
  assignedByUserId:projectTemplateCollegeAssignments.assignedByUserId,
 }).from(projectTemplateCollegeAssignments)
  .innerJoin(colleges,eq(colleges.id,projectTemplateCollegeAssignments.collegeId))
  .where(and(eq(projectTemplateCollegeAssignments.templateId,templateId),
   includeHistory?undefined:isNull(projectTemplateCollegeAssignments.revokedAt),
   selectedScope(context)))
  .orderBy(asc(colleges.name),asc(projectTemplateCollegeAssignments.assignedAt));
 return rows.map(row=>({...row,active:row.revokedAt===null,
  updatedAt:row.revokedAt??row.assignedAt,
  actorLabel:row.assignedByUserId??"System / legacy import"}));
}

export async function listCollegeAssignedTemplates(
 context:RequestContext,rawCollegeId:string,
){
 requirePermission(context,"project-template.read");
 const collegeId=z.string().uuid().parse(rawCollegeId);
 const rows=await getDb().select({
  id:projectTemplateCollegeAssignments.id,
  templateId:projectTemplates.id,templateTitle:projectTemplates.title,
  templateSlug:projectTemplates.slug,
  templateVersionId:projectTemplateCollegeAssignments.templateVersionId,
  assignedAt:projectTemplateCollegeAssignments.assignedAt,
  assignedByUserId:projectTemplateCollegeAssignments.assignedByUserId,
 }).from(projectTemplateCollegeAssignments)
  .innerJoin(projectTemplates,eq(projectTemplates.id,projectTemplateCollegeAssignments.templateId))
  .innerJoin(colleges,eq(colleges.id,projectTemplateCollegeAssignments.collegeId))
  .where(and(eq(projectTemplateCollegeAssignments.collegeId,collegeId),
   isNull(projectTemplateCollegeAssignments.revokedAt),selectedScope(context)))
  .orderBy(asc(projectTemplates.title),asc(projectTemplates.id));
 return rows.map(row=>({...row,active:true as const,
  actorLabel:row.assignedByUserId??"System / legacy import"}));
}
