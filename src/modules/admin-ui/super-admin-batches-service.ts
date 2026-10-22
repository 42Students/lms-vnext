import "server-only";
import {and,asc,count,eq,ilike,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {academicPeriods,cohorts,colleges,departments,programs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listAdminBatches(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),selected=requireSuperAdminSelectedCollege(context,"academics.read");
 const db=getDb();
 const source=db.select({
  id:aliasedColumn(cohorts.id,"admin_batch_id"),
  name:aliasedColumn(cohorts.name,"admin_batch_name"),
  code:aliasedColumn(cohorts.code,"admin_batch_code"),
  status:aliasedColumn(cohorts.status,"admin_batch_status"),
  programName:aliasedColumn(programs.name,"admin_batch_program_name"),
  periodName:aliasedColumn(academicPeriods.name,"admin_batch_period_name"),
 }).from(cohorts)
 .innerJoin(programs,eq(programs.id,cohorts.programId))
 .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,selected.collegeId)))
 .innerJoin(colleges,and(eq(colleges.id,departments.collegeId),
  selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
 .innerJoin(academicPeriods,and(eq(academicPeriods.id,cohorts.startPeriodId),eq(academicPeriods.collegeId,selected.collegeId)))
 .where(and(
  query.status==="ALL"?undefined:eq(cohorts.status,query.status as "PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED"),
  query.q?or(ilike(cohorts.name,scopedSearchLike(query.q)),ilike(cohorts.code,scopedSearchLike(query.q)),ilike(programs.name,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_batch_directory");
 const [counts,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.programName),asc(source.name),asc(source.id))
   .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=counts[0]?.total??0;
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),items:rows.map(row=>({
  id:row.id,title:row.name,subtitle:row.programName,status:row.status,
  details:["Batch code: "+row.code,"Start period: "+row.periodName],
 }))};
}
