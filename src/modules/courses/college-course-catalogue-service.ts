import "server-only";
import {and,asc,desc,count,eq,ilike,isNull,or,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courses,departments} from "@/db/schema";
import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {loadAcademicCollegeScope} from "@/modules/academics/scope";
import {listFacultyCourseDeliveries} from "./faculty-course-service";
import {listLearnerCourseDeliveries} from "./learner-course-service";
import {z} from "zod";
import {collegeCourseCatalogueQuerySchema,COLLEGE_COURSE_CATALOGUE_PAGE_SIZE,
 type CollegeCourseCatalogueQuery} from "./college-course-catalogue-model";
import {collegeCourseCatalogueExportQuerySchema,COLLEGE_COURSE_EXPORT_CAP} from "./college-course-catalogue-export-model";

async function authorizedCollege(context:RequestContext){
 const membership=context.membership;
 if(!membership||membership.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
    !hasMembershipRole(context,"COLLEGE_ADMIN"))
  throw new AuthorizationError("courses.read");
 const college=await loadAcademicCollegeScope(membership.collegeId);
 if(membership.organizationId!==college.organizationId)throw new AuthorizationError("courses.read");
 requirePermission(context,"courses.read",{
  organizationId:college.organizationId,collegeId:college.id,
 });
 return college;
}
function whereCatalogue(collegeId:string,q:string){
 const escaped="%"+q.replace(/[\\%_]/g,"\\$&")+"%";
 return and(eq(departments.collegeId,collegeId),isNull(departments.archivedAt),
  eq(courses.status,"ACTIVE"),
  q?or(ilike(courses.name,escaped),ilike(courses.code,escaped),
   ilike(departments.name,escaped)):undefined);
}
function orderCatalogue(sort:CollegeCourseCatalogueQuery["sort"]){
 switch(sort){
  case "NAME_DESC":return [desc(courses.name),asc(courses.id)];
  case "CODE_ASC":return [asc(courses.code),asc(courses.id)];
  case "CODE_DESC":return [desc(courses.code),asc(courses.id)];
  default:return [asc(courses.name),asc(courses.id)];
 }
}
/** A dedicated SQL-scoped catalogue; unlike the admin workspace, this never loads
 * the full offerings/deliveries/college membership graph. */
export async function listCollegeCourseCatalogue(
 context:RequestContext,raw:unknown,
){
 const query=collegeCourseCatalogueQuerySchema.parse(raw);
 const college=await authorizedCollege(context);
 const db=getDb(),predicate=whereCatalogue(college.id,query.q);
 const [totalRow]=await db.select({total:count()}).from(courses)
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(predicate);
 const total=totalRow?.total??0;
 const pages=Math.max(1,Math.ceil(total/COLLEGE_COURSE_CATALOGUE_PAGE_SIZE));
 const page=Math.min(query.page,pages);
 const items=await db.select({
  id:courses.id,name:courses.name,code:courses.code,
  shortTitle:courses.shortTitle,officialCode:courses.officialCode,cardColor:courses.cardColor,takeaways:courses.takeaways,
  description:courses.description,status:courses.status,
  departmentId:courses.departmentId,departmentName:departments.name,
  createdAt:courses.createdAt,updatedAt:courses.updatedAt,
 }).from(courses)
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(predicate).orderBy(...orderCatalogue(query.sort))
  .limit(COLLEGE_COURSE_CATALOGUE_PAGE_SIZE)
  .offset((page-1)*COLLEGE_COURSE_CATALOGUE_PAGE_SIZE);
 return {query,items,total,pages,page,pageSize:COLLEGE_COURSE_CATALOGUE_PAGE_SIZE};
}
/** Export reads a bounded SQL slice; private college records never leak across tenants. */
export async function listCollegeCourseCatalogueExport(context:RequestContext,raw:unknown){
 const query=collegeCourseCatalogueExportQuerySchema.parse(raw);
 const college=await authorizedCollege(context);
 const rows=await getDb().select({
  id:courses.id,name:courses.name,code:courses.code,shortTitle:courses.shortTitle,
  officialCode:courses.officialCode,cardColor:courses.cardColor,takeaways:courses.takeaways,description:courses.description,
  status:courses.status,departmentName:departments.name,
 }).from(courses).innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(whereCatalogue(college.id,query.q))
  .orderBy(...orderCatalogue(query.sort)).limit(COLLEGE_COURSE_EXPORT_CAP+1);
 return {rows:rows.slice(0,COLLEGE_COURSE_EXPORT_CAP),truncated:rows.length>COLLEGE_COURSE_EXPORT_CAP};
}

/** Autocomplete is a narrow authorized suggestion read, never a substitute
 * for the manager's paged catalogue/export. Exact code/name matches rank
 * above prefixes and fuzzy word matches; recently selected IDs are scoped to
 * the current session and are not treated as persistent analytics.
 */
export async function searchAuthorizedCourseSuggestions(
 context:RequestContext,raw:unknown,
){
 const input=z.strictObject({
  q:z.string().trim().min(1).max(100),
  limit:z.number().int().min(1).max(30).default(12),
 }).parse(raw);
 const scope=context.membership;
 const collegeId=isSuperAdmin(context)?context.adminScope?.collegeId:scope?.collegeId;
 if(!collegeId||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("courses.read");
 let authorizedIds:string[]|null=null;
 if(hasMembershipRole(context,"FACULTY")&&!hasMembershipRole(context,"COLLEGE_ADMIN")&&!isSuperAdmin(context)){
  const grants=await listFacultyCourseDeliveries(context);
  authorizedIds=[...new Set(grants.map(row=>row.courseId))];
 }else if(hasMembershipRole(context,"LEARNER")&&!hasMembershipRole(context,"COLLEGE_ADMIN")&&!isSuperAdmin(context)){
  const grants=await listLearnerCourseDeliveries(context);
  authorizedIds=[...new Set(grants.map(row=>row.courseId))];
 }else requirePermission(context,"courses.read",{
  collegeId,organizationId:isSuperAdmin(context)?context.adminScope?.organizationId:scope?.organizationId,
 });
 if(authorizedIds?.length===0)return [];
 const text=input.q.toLowerCase();
 const pattern="%"+text.replace(/[\\%_]/g,"\\$&")+"%";
 const rows=await getDb().select({
  id:courses.id,name:courses.name,code:courses.code,departmentName:departments.name,
 }).from(courses).innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(and(eq(departments.collegeId,collegeId),eq(courses.status,"ACTIVE"),
    isNull(departments.archivedAt),
    authorizedIds?inArray(courses.id,authorizedIds):undefined,
    or(ilike(courses.name,pattern),ilike(courses.code,pattern),
      ilike(departments.name,pattern))))
  .orderBy(asc(courses.name),asc(courses.id)).limit(300);
 const words=text.split(/\s+/).filter(Boolean);
 const rank=(row:typeof rows[number])=>{
  const code=row.code.toLowerCase(),name=row.name.toLowerCase(),department=row.departmentName.toLowerCase();
  if(code===text)return 0;
  if(name===text)return 1;
  if(code.startsWith(text))return 2;
  if(name.startsWith(text))return 3;
  if(words.every(word=>name.includes(word)||code.includes(word)))return 4;
  return department.includes(text)?6:5;
 };
 return [...rows].sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id))
  .slice(0,input.limit);
}
