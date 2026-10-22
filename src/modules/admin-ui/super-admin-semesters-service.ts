import "server-only";
import { and,asc,count,eq,ilike,or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { aliasedColumn } from "@/db/aliased-column";
import { colleges,departments,programs,programTerms } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {hasActiveMembership,isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import { requireSuperAdminSelectedCollege } from "./super-admin-selected-college";
import {
 superAdminReadQuerySchema,superAdminReadPages,scopedSearchLike,
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

/**
 * Program-scoped, unpaginated compatibility reader for the legacy fetchAll /
 * fetchAllSemesters / fetchActiveSemesters flows. The selected college (for
 * Super Admin) or active college membership bounds every query; no caller may
 * select an arbitrary tenant by passing a program ID.
 */
const accessibleSemestersQuery=z.strictObject({
 programId:z.string().uuid().optional(),
 activeOnly:z.boolean().default(false),
});
export type AccessibleSemester={
 id:string;programId:string;name:string;termNumber:number;
 totalCredits:number|null;isActive:boolean;
};
export async function readAccessibleProgramSemesters(
 context:RequestContext,raw:unknown,
):Promise<AccessibleSemester[]>{
 const query=accessibleSemestersQuery.parse(raw);
 const selected=isSuperAdmin(context)
  ?requireSuperAdminSelectedCollege(context,"academics.read")
  :hasActiveMembership(context)&&context.membership
   ?{collegeId:context.membership.collegeId,organizationId:context.membership.organizationId}
   :null;
 if(!selected)throw new AuthorizationError("academics.read");
 requirePermission(context,"academics.read",{
  collegeId:selected.collegeId,organizationId:selected.organizationId,
 });
 const db=getDb();
 // Like requireAccessProgram in the old LMS: distinguish an inaccessible
 // program from a valid program which simply has no semesters yet.
 if(query.programId){
  const [program]=await db.select({id:programs.id}).from(programs)
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),
    eq(departments.collegeId,selected.collegeId)))
   .innerJoin(colleges,and(eq(colleges.id,departments.collegeId),
    selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
   .where(eq(programs.id,query.programId)).limit(1);
  if(!program)throw new AuthorizationError("academics.read");
 }
 return db.select({
  id:programTerms.id,programId:programTerms.programId,
  name:programTerms.name,termNumber:programTerms.termNumber,
  totalCredits:programTerms.totalCredits,isActive:programTerms.isActive,
 }).from(programTerms)
  .innerJoin(programs,eq(programs.id,programTerms.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),
   eq(departments.collegeId,selected.collegeId)))
  .innerJoin(colleges,and(eq(colleges.id,departments.collegeId),
   selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
  .where(and(query.programId?eq(programs.id,query.programId):undefined,
   query.activeOnly?eq(programTerms.isActive,true):undefined))
  .orderBy(asc(programs.name),asc(programTerms.termNumber),asc(programTerms.id));
}

/** Legacy response envelope is opt-in; vNext callers use
 * the typed bare array or the existing paginated listAdminSemesters service. */
export async function readLegacyProgramSemesters(
 context:RequestContext,raw:unknown,
){
 const data=await readAccessibleProgramSemesters(context,raw);
 return {status:"OK" as const,message:"OK" as const,data};
}
