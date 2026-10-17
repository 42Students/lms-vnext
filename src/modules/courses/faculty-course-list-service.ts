import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { listFacultyCourseDeliveries } from "./faculty-course-service";
import { facultyCourseListQuerySchema, pageFacultyCourseList } from "./faculty-course-list-model";

export async function getFacultyCourseList(context: RequestContext, rawQuery: unknown) {
  const query = facultyCourseListQuerySchema.parse(rawQuery);
  requirePermission(context,"courses.read",{
    collegeId:context.membership?.collegeId, organizationId:context.membership?.organizationId,
  });
  const courses = await listFacultyCourseDeliveries(context);
  const periods = new Map(courses.map(course => [course.academicPeriodId, course.academicPeriodName]));
  const sections = new Map(courses.map(course => [course.sectionId,course.sectionName]));
  return {query, scopeCount:courses.length, ...pageFacultyCourseList(courses,query),
    periods:[...periods].map(([id,name]) => ({id,name})),
    sections:[...sections].map(([id,name])=>({id,name,count:courses.filter(course=>course.sectionId===id).length})),
    assignmentChoices:courses.map(course=>({
      deliveryId:course.deliveryId,courseName:course.courseName,
      sectionName:course.sectionName,academicPeriodName:course.academicPeriodName,
    }))};
}
