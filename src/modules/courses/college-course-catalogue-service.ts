import "server-only";
import {and,asc,desc,count,eq,ilike,isNull,or,inArray,sql} from "drizzle-orm";
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
/** Legacy list/search reads are scoped to the selected college; never cache raw
 * course results across tenants or assume a formerly active record is public. */
function whereCatalogue(collegeId:string,q:string,status:"ACTIVE"|"ARCHIVED"|"ALL"="ACTIVE"){
 const escaped="%"+q.replace(/[\\%_]/g,"\\$&")+"%";
 return and(eq(departments.collegeId,collegeId),isNull(departments.archivedAt),
  status==="ALL"?undefined:eq(courses.status,status),
  q?or(ilike(courses.name,escaped),ilike(courses.code,escaped),
   ilike(courses.shortTitle,escaped),ilike(courses.officialCode,escaped),
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
 const pageSize=Number(query.pageSize??COLLEGE_COURSE_CATALOGUE_PAGE_SIZE);
 const [totalRow]=await db.select({total:count()}).from(courses)
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(predicate);
 const total=totalRow?.total??0;
 const pages=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.min(query.page,pages);
 const items=await db.select({
  id:courses.id,name:courses.name,code:courses.code,
  shortTitle:courses.shortTitle,officialCode:courses.officialCode,cardColor:courses.cardColor,takeaways:courses.takeaways,
  description:courses.description,status:courses.status,
  enabled:courses.enabled,legacyAllowedForDisplay:courses.legacyAllowedForDisplay,
  thumbnailUrl:courses.thumbnailUrl,imageUrl:courses.imageUrl,
  // The public catalogue uses a safe HTTPS source; never expose private
  // object keys or legacy unverified image hosts as direct URLs.
  coverUrl:sql<string|null>`case
    when ${courses.thumbnailUrl} like 'https://%' then ${courses.thumbnailUrl}
    when ${courses.imageUrl} like 'https://%' then ${courses.imageUrl}
    else null end`.as("cover_url"),
  departmentId:courses.departmentId,departmentName:departments.name,
  createdAt:courses.createdAt,updatedAt:courses.updatedAt,
 }).from(courses)
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(predicate).orderBy(...orderCatalogue(query.sort))
  .limit(pageSize)
  .offset((page-1)*pageSize);
 return {query,items,total,pages,page,pageSize};
}
/** Export reads a bounded SQL slice; private college records never leak across tenants. */
export async function listCollegeCourseCatalogueExport(context:RequestContext,raw:unknown){
 const query=collegeCourseCatalogueExportQuerySchema.parse(raw);
 const college=await authorizedCollege(context);
 const rows=await getDb().select({
  id:courses.id,name:courses.name,code:courses.code,shortTitle:courses.shortTitle,
  officialCode:courses.officialCode,cardColor:courses.cardColor,takeaways:courses.takeaways,description:courses.description,
  status:courses.status,departmentId:courses.departmentId,departmentName:departments.name,
  enabled:courses.enabled,legacyAllowedForDisplay:courses.legacyAllowedForDisplay,
 }).from(courses).innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(whereCatalogue(college.id,query.q))
  .orderBy(...orderCatalogue(query.sort)).limit(COLLEGE_COURSE_EXPORT_CAP+1);
 return {rows:rows.slice(0,COLLEGE_COURSE_EXPORT_CAP).map(row=>({
  ...row,active:row.status==="ACTIVE",visibleToLearners:row.legacyAllowedForDisplay!==0,
 })),truncated:rows.length>COLLEGE_COURSE_EXPORT_CAP,
  legacyCsvColumns:["id","courseName","shortTitle","departmentId","active","enabled","visibleToLearners"] as const};
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
  q:z.string().trim().min(1).max(200),
  limit:z.number().int().min(1).max(50).default(15),
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
  shortTitle:courses.shortTitle,officialCode:courses.officialCode,slug:courses.slug,enabled:courses.enabled,
 }).from(courses).innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(and(eq(departments.collegeId,collegeId),eq(courses.status,"ACTIVE"),
    isNull(departments.archivedAt),
    authorizedIds?inArray(courses.id,authorizedIds):undefined,
    or(ilike(courses.name,pattern),ilike(courses.code,pattern),
      ilike(courses.shortTitle,pattern),ilike(courses.officialCode,pattern),
      ilike(departments.name,pattern))))
  .orderBy(asc(courses.name),asc(courses.id)).limit(300);
 const words=text.split(/\s+/).filter(Boolean);
 const rank=(row:typeof rows[number])=>{
  const code=row.code.toLowerCase(),name=row.name.toLowerCase(),department=row.departmentName.toLowerCase();
  const shortTitle=(row.shortTitle??"").toLowerCase(),officialCode=(row.officialCode??"").toLowerCase();
  if(code===text||officialCode===text)return 0;
  if(name===text||shortTitle===text)return 1;
  if(code.startsWith(text)||officialCode.startsWith(text))return 2;
  if(name.startsWith(text)||shortTitle.startsWith(text))return 3;
  if(words.every(word=>name.includes(word)||code.includes(word)||shortTitle.includes(word)))return 4;
  return department.includes(text)?6:5;
 };
 return [...rows].sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id))
  .slice(0,input.limit);
}

/** Permission-scoped legacy-style category, statistics and existence reads.
 * The vNext runtime reads current SQL state, so it needs no global mutable
 * @PostConstruct search cache or cross-tenant refresh endpoint. */
export async function getCollegeCourseSearchMetadata(context:RequestContext){
 const college=await authorizedCollege(context);
 const db=getDb();
 const [courseCounts,categories]=await Promise.all([
  db.select({total:count(),departmentCount:sql<number>`count(distinct ${courses.departmentId})::int`})
   .from(courses).innerJoin(departments,eq(courses.departmentId,departments.id))
   .where(whereCatalogue(college.id,"","ACTIVE")),
  db.select({id:departments.id,name:departments.name}).from(departments)
   .where(and(eq(departments.collegeId,college.id),isNull(departments.archivedAt)))
   .orderBy(sql`lower(${departments.name})`,asc(departments.id)).limit(100),
 ]);
 return {totalCourses:courseCounts[0]?.total??0,departments:courseCounts[0]?.departmentCount??0,
  categories,categoriesTotal:categories.length,
  responseStatus:"Categories retrieved" as const};
}
export async function collegeCourseNameExists(context:RequestContext,rawName:string){
 const college=await authorizedCollege(context);
 const name=z.string().trim().min(1).max(200).parse(rawName);
 const [row]=await getDb().select({id:courses.id}).from(courses)
  .innerJoin(departments,eq(courses.departmentId,departments.id))
  .where(and(whereCatalogue(college.id,"","ALL"),eq(sql<string>`lower(${courses.name})`,name.toLowerCase())))
  .limit(1);
 return {exists:Boolean(row)};
}
export async function listCollegeArchivedCourseSuggestions(context:RequestContext,limit=50){
 const college=await authorizedCollege(context);
 const safeLimit=z.number().int().min(1).max(100).parse(limit);
 const rows=await getDb().select({id:courses.id,name:courses.name,code:courses.code,
  shortTitle:courses.shortTitle,departmentName:departments.name})
  .from(courses).innerJoin(departments,eq(courses.departmentId,departments.id))
  .where(whereCatalogue(college.id,"","ARCHIVED"))
  .orderBy(desc(courses.updatedAt),asc(courses.id)).limit(safeLimit);
 return {rows,scope:"ARCHIVED" as const,readOnly:true};
}
