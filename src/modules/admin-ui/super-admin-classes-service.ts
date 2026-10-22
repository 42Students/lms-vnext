import "server-only";
import {and,asc,count,countDistinct,eq,ilike,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {academicPeriods,cohorts,colleges,departments,programs,sections} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listAdminClasses(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult & {stats:{totalClasses:number;programs:number};categories:string[]}>{
 const query=superAdminReadQuerySchema.parse(raw),selected=requireSuperAdminSelectedCollege(context,"academics.read"),db=getDb();
 const source=db.select({
  id:aliasedColumn(sections.id,"admin_class_id"),
  name:aliasedColumn(sections.name,"admin_class_name"),code:aliasedColumn(sections.code,"admin_class_code"),
  status:aliasedColumn(sections.status,"admin_class_status"),capacity:sections.capacity,
  description:aliasedColumn(sections.description,"admin_class_description"),
  programId:aliasedColumn(programs.id,"admin_class_program_id"),
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
  query.q?or(ilike(sections.name,scopedSearchLike(query.q)),ilike(sections.code,scopedSearchLike(query.q)),
   ilike(sections.description,scopedSearchLike(query.q)),ilike(programs.name,scopedSearchLike(query.q)),
   ilike(cohorts.name,scopedSearchLike(query.q))):undefined,
  query.programId?eq(programs.id,query.programId):undefined,
 )).as("super_admin_classes_directory");
 const rank=query.q?sql<number>`case
   when lower(${source.name}) = ${query.q.toLowerCase()} then 0
   when lower(${source.name}) like ${query.q.toLowerCase()+"%"} then 1
   when lower(${source.programName}) like ${query.q.toLowerCase()+"%"} then 2
   else 3 end`:sql<number>`0`;
 const [counts,rows,stats,categoriesRaw]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(rank,asc(source.programName),asc(source.cohortName),asc(source.name),asc(source.id))
   .limit(query.pageSize).offset((query.page-1)*query.pageSize),
  db.select({totalClasses:count(),programs:countDistinct(source.programId)}).from(source),
  db.select({name:source.programName}).from(source)
   .groupBy(source.programName).orderBy(asc(source.programName)).limit(200),
 ]);
 const total=counts[0]?.total??0;
 const categories=[...new Set(categoriesRaw.map(row=>row.name.trim()).filter(Boolean))]
  .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:"base"}));
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),
  stats:{totalClasses:stats[0]?.totalClasses??0,programs:stats[0]?.programs??0},categories,
  items:rows.map(row=>({
  id:row.id,title:row.name,subtitle:row.programName+" · "+row.cohortName,
  status:row.status,
  details:["Class code: "+row.code,"Period: "+row.periodName,
   row.capacity===null?"Capacity not configured":"Capacity: "+row.capacity,
   "Program: "+row.programName,row.description??"No description"],
  href:`/admin/academics/sections/${encodeURIComponent(row.id)}`,
 }))};
}

/** Case-insensitive category lookup constrained to the selected acting college. */
export async function listAdminClassesByCategory(context:RequestContext,programName:string){
 const normalized=programName.trim().toLowerCase();
 if(!normalized)return [];
 const selected=requireSuperAdminSelectedCollege(context,"academics.read");
 return getDb().select({
  id:sections.id,name:sections.name,description:sections.description,
  programId:programs.id,programName:programs.name,collegeId:departments.collegeId,
 }).from(sections)
  .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,selected.collegeId)))
  .where(sql`lower(trim(${programs.name})) = ${normalized}`)
  .orderBy(asc(sections.name),asc(sections.id)).limit(50);
}
export async function getAdminClassSearchCategories(context:RequestContext){
 const result=await listAdminClasses(context,{page:1,pageSize:25});
 return result.categories;
}
export async function getAdminClassSearchStats(context:RequestContext){
 const result=await listAdminClasses(context,{page:1,pageSize:25});
 return result.stats;
}
