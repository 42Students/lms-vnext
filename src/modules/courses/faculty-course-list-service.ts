import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import {getDb} from "@/db/client";
import {and,eq,inArray,isNotNull,or} from "drizzle-orm";
import {academicPeriods,courseOfferings,courseSectionDeliveries,courseTeachingAssignments,courses as courseTable,departments,sections} from "@/db/schema";
import { listFacultyCourseDeliveries } from "./faculty-course-service";
import { facultyCourseListQuerySchema, pageFacultyCourseList } from "./faculty-course-list-model";

export async function getFacultyCourseList(context: RequestContext, rawQuery: unknown) {
  const query = facultyCourseListQuerySchema.parse(rawQuery);
  requirePermission(context,"courses.read",{
    collegeId:context.membership?.collegeId, organizationId:context.membership?.organizationId,
  });
  const courses = await listFacultyCourseDeliveries(context);
  const membership=context.membership;
  if(!membership)throw new AuthorizationError("courses.read");
  // Historical grants are read-only; never feed a retired delivery into
  // workspace authorization or offer it as a live navigation target.
  const historical=await getDb().select({
    assignmentId:courseTeachingAssignments.id,
    deliveryId:courseSectionDeliveries.id,
    courseId:courseTable.id,courseName:courseTable.name,courseCode:courseTable.code,
    courseSlug:courseTable.slug,sectionId:sections.id,sectionName:sections.name,
    academicPeriodId:academicPeriods.id,academicPeriodName:academicPeriods.name,
    teachingRole:courseTeachingAssignments.role,
    assignmentEndedAt:courseTeachingAssignments.endedAt,
    deliveryEndedAt:courseSectionDeliveries.endedAt,
  }).from(courseTeachingAssignments)
   .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(courseTable,eq(courseTable.id,courseOfferings.courseId))
   .innerJoin(departments,and(eq(departments.id,courseTable.departmentId),
     eq(departments.collegeId,membership.collegeId)))
   .innerJoin(sections,and(eq(sections.id,courseSectionDeliveries.sectionId),
     eq(sections.cohortId,courseOfferings.cohortId),
     eq(sections.academicPeriodId,courseOfferings.academicPeriodId)))
   .innerJoin(academicPeriods,and(eq(academicPeriods.id,courseOfferings.academicPeriodId),
     eq(academicPeriods.collegeId,membership.collegeId)))
   .where(and(eq(courseTeachingAssignments.membershipId,membership.id),
     or(isNotNull(courseTeachingAssignments.endedAt),isNotNull(courseSectionDeliveries.endedAt))))
   .limit(501);
  const activeIds=[...new Set(courses.map(course=>course.courseId))];
  const courseMetadata=activeIds.length?await getDb().select({
    id:courseTable.id,slug:courseTable.slug,legacyId:courseTable.legacyCourseId,
  }).from(courseTable).where(inArray(courseTable.id,activeIds)):[];
  const byCourseId=new Map(courseMetadata.map(course=>[course.id,course]));
  const grouped=new Map<string,{courseId:string;courseName:string;courseSlug:string|null;
    legacyCourseId:number|null;sections:Set<string>;deliveries:Set<string>}>();
  for(const course of courses){
    const entry=grouped.get(course.courseId)??{
      courseId:course.courseId,courseName:course.courseName,
      courseSlug:byCourseId.get(course.courseId)?.slug??null,
      legacyCourseId:byCourseId.get(course.courseId)?.legacyId??null,
      sections:new Set<string>(),deliveries:new Set<string>(),
    };
    entry.sections.add(course.sectionId);
    entry.deliveries.add(course.deliveryId);
    grouped.set(course.courseId,entry);
  }
  const periods = new Map(courses.map(course => [course.academicPeriodId, course.academicPeriodName]));
  const sections = new Map(courses.map(course => [course.sectionId,course.sectionName]));
  return {query, scopeCount:courses.length, ...pageFacultyCourseList(courses,query),
    periods:[...periods].map(([id,name]) => ({id,name})),
    sections:[...sections].map(([id,name])=>({id,name,count:courses.filter(course=>course.sectionId===id).length})),
    assignmentChoices:courses.map(course=>({
      assignmentId:course.teachingAssignmentId,
      deliveryId:course.deliveryId,courseId:course.courseId,
      courseSlug:byCourseId.get(course.courseId)?.slug??null,
      courseName:course.courseName,sectionName:course.sectionName,
      academicPeriodName:course.academicPeriodName,
    })),
    courseAggregates:[...grouped.values()].map(group=>({
      courseId:group.courseId,courseName:group.courseName,
      courseSlug:group.courseSlug,legacyCourseId:group.legacyCourseId,
      sectionCount:group.sections.size,deliveryCount:group.deliveries.size,
    })),
    historicalAssignments:historical.slice(0,500),
    historicalTruncated:historical.length>500,
  };
}
