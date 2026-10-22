import "server-only";

import {and,asc,eq,ilike,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 colleges,organizations,departments,courses,courseOfferings,
 courseLearningPaths,courseLessons,
} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

export const GLOBAL_LESSON_INDEX_PAGE_SIZE=50;

/**
 * Legacy /search/lessons stats + refresh replacement. This is a read-only,
 * uncached global ADMIN index, not a global authoring permission. The header's
 * college x role switcher controls all mutations; this query intentionally
 * ignores the currently selected college to support historic all=true reads.
 */
export async function listGlobalSuperAdminLessonIndex(
 context:RequestContext,options:{q:string;page:number},
){
 if(!isSuperAdmin(context))throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 const q=options.q.trim();
 if(q.length>80||!Number.isSafeInteger(options.page)||options.page<1||options.page>1000)
  throw new Error("INVALID_GLOBAL_LESSON_FILTER");
 const db=getDb();
 const conditions=[
  eq(colleges.status,"ACTIVE"),eq(organizations.status,"ACTIVE"),
  q?or(ilike(colleges.name,like(q)),ilike(colleges.code,like(q)),
    ilike(organizations.name,like(q))):undefined,
 ];
 const rows=await db.select({
  collegeId:colleges.id,collegeName:colleges.name,collegeCode:colleges.code,
  organizationId:organizations.id,organizationName:organizations.name,
  allLessons:sql<number>`count(distinct ${courseLessons.id})::int`.mapWith(Number),
  visibleLessons:sql<number>`count(distinct ${courseLessons.id}) filter (where ${courseLessons.status} = 'ACTIVE' and ${courseLessons.deletedAt} is null and ${courseLessons.visibleToStudents} = true and ${courseLearningPaths.status} = 'PUBLISHED' and ${courseOfferings.status} = 'ACTIVE' and ${courses.status} = 'ACTIVE' and ${courses.enabled} = true)::int`.mapWith(Number),
  inactiveLessons:sql<number>`count(distinct ${courseLessons.id}) filter (where ${courseLessons.status} <> 'ACTIVE' or ${courseLessons.deletedAt} is not null)::int`.mapWith(Number),
 }).from(colleges)
  .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
  .leftJoin(departments,eq(departments.collegeId,colleges.id))
  .leftJoin(courses,eq(courses.departmentId,departments.id))
  .leftJoin(courseOfferings,eq(courseOfferings.courseId,courses.id))
  .leftJoin(courseLearningPaths,eq(courseLearningPaths.offeringId,courseOfferings.id))
  .leftJoin(courseLessons,eq(courseLessons.learningPathId,courseLearningPaths.id))
  .where(and(...conditions))
  .groupBy(colleges.id,colleges.name,colleges.code,organizations.id,organizations.name)
  .orderBy(asc(organizations.name),asc(colleges.name),asc(colleges.id))
  .limit(GLOBAL_LESSON_INDEX_PAGE_SIZE+1)
  .offset((options.page-1)*GLOBAL_LESSON_INDEX_PAGE_SIZE);
 return {
  page:options.page,
  items:rows.slice(0,GLOBAL_LESSON_INDEX_PAGE_SIZE),
  hasNext:rows.length>GLOBAL_LESSON_INDEX_PAGE_SIZE,
  refreshedAt:new Date().toISOString(),
 };
}

function like(value:string){
 return "%"+value.replace(/[\\%_]/g,"\\$&")+"%";
}
