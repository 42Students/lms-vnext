import "server-only";

import { and,asc,count,eq,inArray,isNull,isNotNull,ne,or,sql,type Column } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import { z } from "zod";
import { lessonContentMaterials } from "@/db/schema/lesson-content-materials";
import { loadCourseSectionDeliveryScope } from "./scope";
import { applyDeliveryContentOrderIfReady } from "./lesson-content-order-service";
import { lessonContentOrderRuntimeEnabled } from "./lesson-content-order-readiness";
import {
 academicPeriods,cohorts,courseLearningPaths,courseLessons,courseOfferings,courses,
 departments,lessonContents,programs,courseSectionDeliveries,sections,
 facultyCourseAssociations,courseTeachingAssignments,collegeMemberships,users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError,requirePermission } from "@/modules/permissions/policy";
import {
 adminContentDefaultPageSize,adminContentPages,adminContentQuerySchema,
 adminContentKindSchema,contentTypesForKind,
} from "./super-admin-content-directory-model";
const cohortDepartment=alias(departments,"admin_content_cohort_department");
function aliased<C extends Column>(column:C,name:string) {
 return sql<C["_"]["data"]>`${column}`.mapWith(column).as(name);
}
export async function listSuperAdminContentDirectory(context:RequestContext,rawKind:unknown,rawQuery:unknown) {
 const kind=adminContentKindSchema.parse(rawKind),requested=adminContentQuerySchema.parse(rawQuery);
 const pageSize=requested.pageSize??adminContentDefaultPageSize(kind);
 const query={...requested,pageSize};
 const collegeId=context.adminScope?.collegeId;
 if(!isSuperAdmin(context)||!collegeId)throw new AuthorizationError("courses.read");
 requirePermission(context,"courses.read",{
  collegeId,...(context.adminScope?.organizationId !== undefined ? { organizationId: context.adminScope.organizationId } : {}),
 });
 const pattern="%"+query.q.replace(/[\\%_]/g,"\\$&")+"%";
 const db=getDb();
 const source=db.select({
  id:aliased(lessonContents.id,"admin_content_id"),
  title:aliased(lessonContents.title,"admin_content_title"),
  notes:lessonContents.notes,
  points:lessonContents.points,
  // Do not project an unused SQL expression through a derived table: raw
  // subquery aliases are not stable between Drizzle versions.
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
  learningPathStatus:aliased(courseLearningPaths.status,"admin_learning_path_status"),
  courseStatus:aliased(courses.status,"admin_course_status"),
  offeringId:aliased(courseOfferings.id,"admin_offering_id"),
  lessonId:aliased(courseLessons.id,"admin_lesson_id"),
  deliveryId:lessonContents.deliveryId,
  offeringStatus:aliased(courseOfferings.status,"admin_offering_status"),
  courseName:aliased(courses.name,"admin_course_name"),
  courseCode:aliased(courses.code,"admin_course_code"),
  courseId:aliased(courses.id,"admin_course_id"),
  sectionName:aliased(sections.name,"admin_section_name"),
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
  // A delivery ID is not evidence that the row belongs to the same course
  // offering. Reject corrupt cross-offering links before projecting content.
  .leftJoin(courseSectionDeliveries,and(
    eq(courseSectionDeliveries.id,lessonContents.deliveryId),
    eq(courseSectionDeliveries.offeringId,courseOfferings.id),
  ))
  .leftJoin(sections,and(
    eq(sections.id,courseSectionDeliveries.sectionId),
    eq(sections.cohortId,courseOfferings.cohortId),
    eq(sections.academicPeriodId,courseOfferings.academicPeriodId),
  ))
  .where(and(
   // For section-targeted content, verify both the delivery's offering and
   // its section. A dangling/foreign section never appears in the UI.
   sql`(${lessonContents.deliveryId} is null or ${sections.id} is not null)`,
   inArray(lessonContents.contentType,[...contentTypesForKind(kind)]),
   // Do not show every college resource until a course, lesson or class is selected.
   kind==="RESOURCES"&&!query.offeringId&&!query.lessonId&&!query.deliveryId?sql`false`:undefined,
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
  .limit(pageSize).offset((query.page-1)*pageSize);
 // Resource metadata is safe to display; signed URLs and opaque object keys
 // must still come from the per-material authorization endpoint.
 const resourceIds=items.filter(item=>item.contentType==="RESOURCE").map(item=>item.id);
 const materialRows=resourceIds.length?await db.select({
  lessonContentId:lessonContentMaterials.lessonContentId,
  id:lessonContentMaterials.id,title:lessonContentMaterials.title,
  kind:lessonContentMaterials.kind,sequence:lessonContentMaterials.sequence,
  mimeType:lessonContentMaterials.mimeType,sizeBytes:lessonContentMaterials.sizeBytes,
  originalName:lessonContentMaterials.originalName,uploadStatus:lessonContentMaterials.uploadStatus,
 }).from(lessonContentMaterials)
  .where(inArray(lessonContentMaterials.lessonContentId,resourceIds))
  .orderBy(asc(lessonContentMaterials.sequence),asc(lessonContentMaterials.id)):[];
 // Preserve faculty association and section audience in Super Admin staff review.
 // Membership and course scope are validated before selecting display names.
 const courseIds=[...new Set(items.map(item=>item.courseId))];
 const deliveryIds=[...new Set(items.map(item=>item.deliveryId).filter((id):id is string=>id!==null))];
 const [courseStaff,sectionStaff]=await Promise.all([
  courseIds.length?db.select({courseId:facultyCourseAssociations.courseId,name:users.displayName})
   .from(facultyCourseAssociations)
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,facultyCourseAssociations.membershipId),
    eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(inArray(facultyCourseAssociations.courseId,courseIds),isNull(facultyCourseAssociations.endedAt))):Promise.resolve([]),
  deliveryIds.length?db.select({deliveryId:courseTeachingAssignments.deliveryId,name:users.displayName})
   .from(courseTeachingAssignments)
   .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,courseTeachingAssignments.membershipId),
    eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(inArray(courseTeachingAssignments.deliveryId,deliveryIds),
    isNull(courseTeachingAssignments.endedAt),isNull(courseTeachingAssignments.deletedAt))):Promise.resolve([]),
 ]);
 const facultyNamesByCourse=new Map<string,string[]>();
 for(const row of courseStaff){if(!row.name)continue;
  const names=facultyNamesByCourse.get(row.courseId)??[];
  if(!names.includes(row.name))names.push(row.name);
  facultyNamesByCourse.set(row.courseId,names);
 }
 const facultyNamesByDelivery=new Map<string,string[]>();
 for(const row of sectionStaff){if(!row.name)continue;
  const names=facultyNamesByDelivery.get(row.deliveryId)??[];
  if(!names.includes(row.name))names.push(row.name);
  facultyNamesByDelivery.set(row.deliveryId,names);
 }
 const byContent=new Map<string,typeof materialRows>();
 for(const material of materialRows){
  const existing=byContent.get(material.lessonContentId)??[];
  existing.push(material);byContent.set(material.lessonContentId,existing);
 }
 return {kind,query,total,totalPages:adminContentPages(total,pageSize),items:items.map(item=>({
  ...item,materialCount:byContent.get(item.id)?.length??0,
  materials:byContent.get(item.id)??[],
  facultyNames:facultyNamesByCourse.get(item.courseId)??[],
  sectionFacultyNames:item.deliveryId?facultyNamesByDelivery.get(item.deliveryId)??[]:[],
 }))};
}

/** Section choices are selected-college only and never fetched from global rosters. */
export async function listSuperAdminContentSectionOptions(context:RequestContext){
 const collegeId=context.adminScope?.collegeId;
 if(!isSuperAdmin(context)||!collegeId)throw new AuthorizationError("courses.read");
 requirePermission(context,"courses.read",{collegeId,...(context.adminScope?.organizationId !== undefined ? { organizationId: context.adminScope.organizationId } : {})});
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
  // An imported delivery may point at a section from a foreign cohort or
  // academic period. Both dimensions must match the selected offering.
  .innerJoin(sections,and(
    eq(sections.id,courseSectionDeliveries.sectionId),
    eq(sections.cohortId,courseOfferings.cohortId),
    eq(sections.academicPeriodId,courseOfferings.academicPeriodId),
  ))
  .where(and(eq(departments.collegeId,collegeId),isNull(courseSectionDeliveries.endedAt)))
  .orderBy(asc(courses.name),asc(sections.name)).limit(1000);
}


/** Auditable complete cross-type syllabus for a selected class, distinct from
 * the 25-row tab directory. Its order is per-lesson across RESOURCES, VIDEO,
 * YOUTUBE and LIVE_CLASS, not independently renumbered for each tab.
 * A selected-college Super Admin may inspect the authorized offering;
 * private file URL grants stay behind the per-resource read API.
 */
export async function listSuperAdminSectionSyllabus(
 context:RequestContext,rawOfferingId:string,rawDeliveryId:string|null,
) {
 const offeringId=z.string().uuid().parse(rawOfferingId);
 const deliveryId=rawDeliveryId===null?null:z.string().uuid().parse(rawDeliveryId);
 const collegeId=context.adminScope?.collegeId;
 if(!isSuperAdmin(context)||!collegeId)throw new AuthorizationError("courses.read");
 requirePermission(context,"courses.read",{
  collegeId,...(context.adminScope?.organizationId !== undefined ? { organizationId: context.adminScope.organizationId } : {}),
 });
 if(deliveryId){
  const delivery=await loadCourseSectionDeliveryScope(deliveryId,true);
  if(delivery.offeringId!==offeringId||delivery.collegeId!==collegeId)
   throw new AuthorizationError("courses.read");
 }
 const db=getDb();
 const rows=await db.select({
  id:lessonContents.id,lessonId:lessonContents.lessonId,
  deliveryId:lessonContents.deliveryId,title:lessonContents.title,
  contentType:lessonContents.contentType,status:lessonContents.status,
  visibleToStudents:lessonContents.visibleToStudents,
  points:lessonContents.points,sequence:lessonContents.sequence,
  createdAt:lessonContents.createdAt,
  lessonName:courseLessons.name,lessonSequence:courseLessons.sequence,
 }).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,and(
   eq(courseLearningPaths.id,courseLessons.learningPathId),
   eq(courseLearningPaths.offeringId,offeringId),
  ))
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(
   eq(departments.id,courses.departmentId),eq(departments.collegeId,collegeId),
  ))
  .where(and(
   ne(lessonContents.status,"ARCHIVED"),
   deliveryId?or(isNull(lessonContents.deliveryId),eq(lessonContents.deliveryId,deliveryId)):undefined,
   sql`${lessonContents.deliveryId} is null or exists (
     select 1 from ${courseSectionDeliveries}
     where ${courseSectionDeliveries.id}=${lessonContents.deliveryId}
       and ${courseSectionDeliveries.offeringId}=${offeringId}
   )`,
  ))
  .orderBy(asc(courseLessons.sequence),asc(lessonContents.sequence),asc(lessonContents.id))
  .limit(501);
 const truncated=rows.length>500;
 const visible=rows.slice(0,500);
 const byLesson=new Map<string,typeof visible>();
 for(const row of visible) {
  const items=byLesson.get(row.lessonId)??[];
  items.push(row);byLesson.set(row.lessonId,items);
 }
 const items:(typeof visible)= [];
 for(const [,part] of byLesson)items.push(...await applyDeliveryContentOrderIfReady(part,deliveryId));
 return {
  offeringId,deliveryId,items:items.map(item=>({...item,
   // The mixed syllabus shows other kinds, but editing/deleting belongs to its tab.
   ownTab:item.contentType==="RESOURCE"?"RESOURCES":item.contentType==="LIVE_CLASS"?"LIVE_CLASSES":"VIDEOS",
  })),truncated,
  totalShown:items.length,
  // Atomic full-order writes use updateDeliveryLessonContentOrder,
  // which verifies every visible ID and requires an active order migration.
  canReorder:deliveryId!==null&&!truncated&&lessonContentOrderRuntimeEnabled(),
 };
}
