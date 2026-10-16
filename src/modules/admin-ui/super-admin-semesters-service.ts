import "server-only";
import { and,asc,count,eq,ilike,or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { aliasedColumn } from "@/db/aliased-column";
import { colleges,departments,programs,programTerms } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireSuperAdminSelectedCollege } from "./super-admin-selected-college";
import {
 superAdminReadQuerySchema,superAdminReadPages,scopedSearchLike,SUPER_ADMIN_READ_PAGE_SIZE,
 type SuperAdminReadResult,
} from "./super-admin-read-directory-model";
export async function listAdminSemesters(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult> {
 const query=superAdminReadQuerySchema.parse(raw),selected=requireSuperAdminSelectedCollege(context,"academics.read");
 const db=getDb();
 const source=db.select({
  id:aliasedColumn(programTerms.id,"admin_semester_id"),
  name:aliasedColumn(programTerms.name,"admin_semester_name"),
  termNumber:programTerms.termNumber,totalCredits:programTerms.totalCredits,
  isActive:programTerms.isActive,
  programName:aliasedColumn(programs.name,"admin_semester_program_name"),
  programCode:programs.code,
 }).from(programTerms)
 .innerJoin(programs,eq(programs.id,programTerms.programId))
 .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,selected.collegeId)))
 .innerJoin(colleges,and(eq(colleges.id,departments.collegeId),
  selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
 .where(and(
  query.status==="ALL"?undefined:eq(programTerms.isActive,query.status==="ACTIVE"),
  query.q?or(ilike(programTerms.name,scopedSearchLike(query.q)),ilike(programs.name,scopedSearchLike(query.q))):undefined,
 )).as("admin_semesters_directory");
 const [totals,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.programName),asc(source.termNumber),asc(source.id))
   .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=totals[0]?.total??0;
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),
  items:rows.map(r=>({id:r.id,title:r.name,subtitle:r.programName+" ("+r.programCode+")",
   status:r.isActive?"ACTIVE":"INACTIVE",details:["Term "+r.termNumber,r.totalCredits===null?"Credits not recorded":r.totalCredits+" credits"]}))};
}
