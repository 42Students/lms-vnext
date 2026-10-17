import "server-only";

import { and,asc,count,eq,ilike,inArray,isNull,isNotNull,sql,type Column } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import {
 academicPeriods,cohorts,courseLearningPaths,courseLessons,courseOfferings,courses,
 departments,lessonContents,programs,courseSectionDeliveries,sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError,requirePermission } from "@/modules/permissions/policy";
import {
 ADMIN_CONTENT_PAGE_SIZE,adminContentPages,adminContentQuerySchema,
 adminContentKindSchema,contentTypesForKind,
} from "./super-admin-content-directory-model";
const cohortDepartment=alias(departments,"admin_content_cohort_department");
function aliased<C extends Column>(column:C,name:string) {
 return sql<C["_"]["data"]>`${column}`.mapWith(column).as(name);
}
export async function listSuperAdminContentDirectory(context:RequestContext,rawKind:unknown,rawQuery:unknown) {
 const kind=adminContentKindSchema.parse(rawKind),query=adminContentQuerySchema.parse(rawQuery);
 const collegeId=context.adminScope?.collegeId;
 if(!isSuperAdmin(context)||!collegeId)throw new AuthorizationError("courses.read");
 requirePermission(context,"courses.read",{
  collegeId,organizationId:context.adminScope?.organizationId,
 });
 const pattern="%"+query.q.replace(/[\\%_]/g,"\\$&")+"%";
 const db=getDb();
 const source=db.select({
  id:aliased(lessonContents.id,"admin_content_id"),
  title:aliased(lessonContents.title,"admin_content_title"),
  notes:lessonContents.notes,
  contentType:lessonContents.contentType,
  status:aliased(lessonContents.status,"admin_content_status"),
  sequence:lessonContents.sequence,
  visibleToStudents:lessonContents.visibleToStudents,
  externalUrl:lessonContents.externalUrl,
  durationSeconds:lessonContents.durationSeconds,
  startsAt:lessonContents.startsAt,
  endsAt:lessonContents.endsAt,
  lessonName:aliased(courseLessons.name,"admin_lesson_name"),
  lessonStatus:aliased(courseLessons.status,"admin_lesson_status"),
  offeringId:aliased(courseOfferings.id,"admin_offering_id"),
  lessonId:courseLessons.id,
  deliveryId:lessonContents.deliveryId,
  offeringStatus:aliased(courseOfferings.status,"admin_offering_status"),
  courseName:aliased(courses.name,"admin_course_name"),
  courseCode:courses.code,
  cohortName:aliased(cohorts.name,"admin_cohort_name"),
  periodName:aliased(academicPeriods.name,"admin_period_name"),
 }).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId)))
  .innerJoin(cohorts,eq(cohorts.id,courseOfferings.cohortId))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(cohortDepartment,and(eq(cohortDepartment.id,programs.departmentId),eq(cohortDepartment.collegeId,collegeId)))
  .innerJoin(academicPeriods,and(eq(academicPeriods.id,courseOfferings.academicPeriodId),eq(academicPeriods.collegeId,collegeId)))
  .where(and(
   inArray(lessonContents.contentType,[...contentTypesForKind(kind)]),
   query.status==="ALL"?undefined:eq(lessonContents.status,query.status),
   query.offeringId?eq(courseOfferings.id,query.offeringId):undefined,
   query.lessonId?eq(courseLessons.id,query.lessonId):undefined,
   query.deliveryId?eq(lessonContents.deliveryId,query.deliveryId):undefined,
   query.scope==="SHARED"?isNull(lessonContents.deliveryId):
    query.scope==="SECTION"?isNotNull(lessonContents.deliveryId):undefined,
   query.q?sql`(${lessonContents.title} ilike ${pattern} or ${courseLessons.name} ilike ${pattern} or ${courses.name} ilike ${pattern} or ${courses.code} ilike ${pattern})`:undefined,
  )).as("admin_content_directory_scope");
 const [totalRow]=await db.select({total:count()}).from(source);
 const total=totalRow?.total??0;
 const items=await db.select().from(source)
  .orderBy(asc(source.courseName),asc(source.lessonName),asc(source.sequence),asc(source.id))
  .limit(ADMIN_CONTENT_PAGE_SIZE).offset((query.page-1)*ADMIN_CONTENT_PAGE_SIZE);
 return {kind,query,total,totalPages:adminContentPages(total),items};
}

/** Section choices are selected-college only and never fetched from global rosters. */
export async function listSuperAdminContentSectionOptions(context:RequestContext){
 const collegeId=context.adminScope?.collegeId;
 if(!isSuperAdmin(context)||!collegeId)throw new AuthorizationError("courses.read");
 requirePermission(context,"courses.read",{collegeId,organizationId:context.adminScope?.organizationId});
 return getDb().select({
  id:courseSectionDeliveries.id,
  offeringId:courseSectionDeliveries.offeringId,
  courseCode:courses.code,
  courseName:courses.name,
  sectionName:sections.name,
 }).from(courseSectionDeliveries)
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .innerJoin(sections,eq(sections.id,courseSectionDeliveries.sectionId))
  .where(and(eq(departments.collegeId,collegeId),isNull(courseSectionDeliveries.endedAt)))
  .orderBy(asc(courses.name),asc(sections.name)).limit(1000);
}
