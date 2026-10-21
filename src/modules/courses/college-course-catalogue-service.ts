import "server-only";
import {and,asc,desc,count,eq,ilike,isNull,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courses,departments} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {loadAcademicCollegeScope} from "@/modules/academics/scope";
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
  enabled:courses.enabled,legacyAllowedForDisplay:courses.legacyAllowedForDisplay,
  thumbnailUrl:courses.thumbnailUrl,imageUrl:courses.imageUrl,
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
