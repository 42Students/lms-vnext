import "server-only";
import {and,asc,count,eq,ilike,or} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,courses,departments,programs,programTermCourses,programTerms} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
const courseDepartment=alias(departments,"admin_mapping_course_department");
export async function listAdminTermCourseMappings(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),selected=requireSuperAdminSelectedCollege(context,"courses.read"),db=getDb();
 const source=db.select({
  id:aliasedColumn(programTermCourses.id,"admin_mapping_id"),
  type:programTermCourses.type,credits:programTermCourses.credits,
  courseName:aliasedColumn(courses.name,"admin_mapping_course_name"),
  courseCode:courses.code,
  programName:aliasedColumn(programs.name,"admin_mapping_program_name"),
  termName:aliasedColumn(programTerms.name,"admin_mapping_term_name"),
  termNumber:programTerms.termNumber,
  active:programTerms.isActive,
 }).from(programTermCourses)
 .innerJoin(programTerms,eq(programTerms.id,programTermCourses.programTermId))
 .innerJoin(programs,eq(programs.id,programTerms.programId))
 .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,selected.collegeId)))
 .innerJoin(courses,eq(courses.id,programTermCourses.courseId))
 .innerJoin(courseDepartment,and(eq(courseDepartment.id,courses.departmentId),eq(courseDepartment.collegeId,selected.collegeId)))
 .innerJoin(colleges,and(eq(colleges.id,departments.collegeId),
  selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
 .where(and(
  query.status==="ALL"?undefined:eq(programTerms.isActive,query.status==="ACTIVE"),
  query.q?or(ilike(courses.name,scopedSearchLike(query.q)),ilike(courses.code,scopedSearchLike(query.q)),ilike(programs.name,scopedSearchLike(query.q)),ilike(programTerms.name,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_term_course_mapping");
 const [counts,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.programName),asc(source.termNumber),asc(source.courseName),asc(source.id))
   .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=counts[0]?.total??0;
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),items:rows.map(row=>({
  id:row.id,title:row.courseName,subtitle:row.programName+" · "+row.termName,
  status:row.active?"ACTIVE":"INACTIVE",
  details:["Course: "+row.courseCode,"Term "+row.termNumber,"Type: "+row.type,
   row.credits===null?"Credits not recorded":"Credits: "+row.credits],
 }))};
}
