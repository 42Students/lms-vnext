import "server-only";

import {and,asc,eq,isNull,ne,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 courseSectionDeliveries,courseOfferings,courses,departments,sections,
 courseLearningPaths,courseLessons,lessonContents,
} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {loadCourseSectionDeliveryScope} from "./scope";
import {CoursesServiceError} from "./errors";
import {applyDeliveryContentOrderIfReady} from "./lesson-content-order-service";
import {lessonContentOrderRuntimeEnabled} from "./lesson-content-order-readiness";

/** College Admin sees only deliveries in the currently selected membership
 * college. Inputs from links are verified against that server-owned roster. */
export async function listCollegeSectionSyllabusChoices(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE")
  throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
 requirePermission(context,"courses.manage",{
  organizationId:member.organizationId,collegeId:member.collegeId,
 });
 return getDb().select({
  id:courseSectionDeliveries.id,offeringId:courseOfferings.id,
  courseCode:courses.code,courseName:courses.name,
  sectionName:sections.name,
 }).from(courseSectionDeliveries)
  .innerJoin(courseOfferings,and(
   eq(courseOfferings.id,courseSectionDeliveries.offeringId),
   eq(courseOfferings.status,"ACTIVE"),
  ))
  .innerJoin(courses,and(eq(courses.id,courseOfferings.courseId),
   eq(courses.status,"ACTIVE")))
  .innerJoin(departments,and(
   eq(departments.id,courses.departmentId),
   eq(departments.collegeId,member.collegeId),
  ))
  .innerJoin(sections,and(
   eq(sections.id,courseSectionDeliveries.sectionId),
   eq(sections.cohortId,courseOfferings.cohortId),
   eq(sections.academicPeriodId,courseOfferings.academicPeriodId),
  ))
  .where(isNull(courseSectionDeliveries.endedAt))
  .orderBy(asc(courses.name),asc(sections.name))
  .limit(1000);
}

export async function listCollegeSectionSyllabus(
 context:RequestContext,offeringId:string,deliveryId:string,
){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE")
  throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
 const delivery=await loadCourseSectionDeliveryScope(deliveryId);
 if(delivery.offeringId!==offeringId||delivery.collegeId!==member.collegeId)
  throw new CoursesServiceError("CONTENT_DELIVERY_MISMATCH");
 requirePermission(context,"courses.manage",{
  organizationId:delivery.organizationId,collegeId:delivery.collegeId,
 });
 const rows=await getDb().select({
  id:lessonContents.id,title:lessonContents.title,
  contentType:lessonContents.contentType,sequence:lessonContents.sequence,
  createdAt:lessonContents.createdAt,lessonId:courseLessons.id,
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
   eq(departments.id,courses.departmentId),
   eq(departments.collegeId,member.collegeId),
  ))
  .where(and(
   ne(lessonContents.status,"ARCHIVED"),
   or(isNull(lessonContents.deliveryId),
    eq(lessonContents.deliveryId,deliveryId)),
  ))
  .orderBy(asc(courseLessons.sequence),asc(lessonContents.sequence),
   asc(lessonContents.id))
  .limit(501);
 const truncated=rows.length>500;
 const items=rows.slice(0,500);
 const grouped=new Map<string,typeof items>();
 for(const row of items){
  const previous=grouped.get(row.lessonId)??[];
  previous.push(row);
  grouped.set(row.lessonId,previous);
 }
 const ordered=await Promise.all([...grouped.entries()].map(async ([lessonId,part])=>({
  lessonId,lessonName:part[0]?.lessonName??"Lesson",
  items:await applyDeliveryContentOrderIfReady(part,deliveryId),
 })));
 return {offeringId,deliveryId,ordered,truncated,
  canReorder:!truncated&&lessonContentOrderRuntimeEnabled()};
}
