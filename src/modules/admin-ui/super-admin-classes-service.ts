import "server-only";
import {and,asc,count,eq,ilike,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {academicPeriods,cohorts,colleges,departments,programs,sections} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listAdminClasses(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),selected=requireSuperAdminSelectedCollege(context,"academics.read"),db=getDb();
 const source=db.select({
  id:aliasedColumn(sections.id,"admin_class_id"),
  name:aliasedColumn(sections.name,"admin_class_name"),code:aliasedColumn(sections.code,"admin_class_code"),
  status:aliasedColumn(sections.status,"admin_class_status"),capacity:sections.capacity,
  programName:aliasedColumn(programs.name,"admin_class_program_name"),
  cohortName:aliasedColumn(cohorts.name,"admin_class_cohort_name"),
  periodName:aliasedColumn(academicPeriods.name,"admin_class_period_name"),
 }).from(sections)
 .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
 .innerJoin(programs,eq(programs.id,cohorts.programId))
 .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,selected.collegeId)))
 .innerJoin(colleges,and(eq(colleges.id,departments.collegeId),
  selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
 .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),eq(academicPeriods.collegeId,selected.collegeId)))
 .where(and(
  query.status==="ALL"?undefined:eq(sections.status,query.status as "ACTIVE"|"ARCHIVED"),
  query.q?or(ilike(sections.name,scopedSearchLike(query.q)),ilike(sections.code,scopedSearchLike(query.q)),ilike(cohorts.name,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_classes_directory");
 const [counts,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.programName),asc(source.cohortName),asc(source.name),asc(source.id))
   .limit(SUPER_ADMIN_READ_PAGE_SIZE).offset((query.page-1)*SUPER_ADMIN_READ_PAGE_SIZE),
 ]);
 const total=counts[0]?.total??0;
 return {query,total,totalPages:superAdminReadPages(total),items:rows.map(row=>({
  id:row.id,title:row.name,subtitle:row.programName+" · "+row.cohortName,
  status:row.status,
  details:["Class code: "+row.code,"Period: "+row.periodName,
   row.capacity===null?"Capacity not configured":"Capacity: "+row.capacity],
  href:`/admin/academics/sections/${encodeURIComponent(row.id)}`,
 }))};
}
