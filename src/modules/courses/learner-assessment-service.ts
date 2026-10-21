import {z} from "zod";
import type { RequestContext } from "@/modules/identity/context";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {learnerProgramEnrollments,sectionEnrollments,sections} from "@/db/schema";
import {AuthorizationError} from "@/modules/permissions/policy";
import {CoursesServiceError} from "./errors";
import { requireOwnCourseLearnerRead } from "./learner-access-guard";
import {listLearnerCourseDeliveries} from "./learner-course-service";
import {listOwnLearnerAssessmentRows} from "./learner-assessment-flat-query";
import {learnerAssessmentAuthorizedCourse} from "./learner-assessment-course-query-model";

function byDueDateThenTitle<
  T extends {
    dueAt: Date | null;
    title: string;
  },
>(left: T, right: T) {
  const leftDue =
    left.dueAt?.getTime() ??
    Number.MAX_SAFE_INTEGER;
  const rightDue =
    right.dueAt?.getTime() ??
    Number.MAX_SAFE_INTEGER;

  return (
    leftDue - rightDue ||
    left.title.localeCompare(right.title)
  );
}

export async function getLearnerAssessmentOverview(
  context: RequestContext,
  options:{courseId?:unknown;page?:unknown;pageSize?:unknown}={},
) {
  await requireOwnCourseLearnerRead(context);
  const snapshotNowMs = Date.now();
  const deliveries =
    await listLearnerCourseDeliveries(context);
  // An empty published course list does not prove the learner has no class.
  // Probe persisted ACTIVE learner-section enrollment instead.
  let classScope:"NONE"|"PRESENT"|"UNAVAILABLE"="NONE";
  try{
    if(!context.membership)throw new AuthorizationError("courses.read");
    const classes=await getDb().select({id:sectionEnrollments.id})
      .from(sectionEnrollments)
      .innerJoin(learnerProgramEnrollments,
        eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId))
      .innerJoin(sections,and(
        eq(sections.id,sectionEnrollments.sectionId),
        eq(sections.status,"ACTIVE"),
        eq(sections.cohortId,learnerProgramEnrollments.cohortId),
        eq(sections.academicPeriodId,sectionEnrollments.academicPeriodId),
      ))
      .where(and(eq(learnerProgramEnrollments.membershipId,context.membership.id),
        eq(learnerProgramEnrollments.status,"ACTIVE"),
        eq(sectionEnrollments.status,"ACTIVE")))
      .limit(1);
    classScope=classes.length>0?"PRESENT":"NONE";
  }catch(error){
    if(error instanceof AuthorizationError)throw error;
    classScope="UNAVAILABLE";
  }
  const selectedCourseId=learnerAssessmentAuthorizedCourse(options.courseId,deliveries);
  // A forged, malformed, or no-longer-enrolled course filter must not silently
  // reset to "All courses"; retain only the explicit empty-filter behavior.
  const requestedCourse=options.courseId!==undefined&&options.courseId!==null&&options.courseId!=="";
  if(requestedCourse&&!selectedCourseId)throw new CoursesServiceError("COURSE_NOT_FOUND");
  const scopedDeliveries=selectedCourseId?deliveries.filter(row=>row.courseId===selectedCourseId):deliveries;
  // The legacy list uses 20-row pages. Existing unpaged callers retain their
  // full authorized overview; explicitly paged consumers push LIMIT/OFFSET
  // down into both assessment queries, preserving due-date ordering.
  const page=options.page===undefined?null:z.coerce.number().int().min(1).max(100000).parse(options.page);
  const pageSize=options.pageSize===undefined?20:z.coerce.number().int().min(1).max(100).parse(options.pageSize);
  const result=await listOwnLearnerAssessmentRows(scopedDeliveries,context.membership!.id,snapshotNowMs,
    page===null?undefined:{page,pageSize});
  const {assignments,quizzes}=result;

  assignments.sort(byDueDateThenTitle);
  quizzes.sort(byDueDateThenTitle);

  const courses = [
    ...new Map(
      deliveries.map((delivery) => [
        delivery.courseId,
        {
          id: delivery.courseId,
          name: delivery.courseName,
          code: delivery.courseCode,
        },
      ]),
    ).values(),
  ].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return {
    snapshotNowMs,
    classScope,
    selectedCourseId,
    courses,
    assignments,
    quizzes,
    ...(page!==null?{pagination:{page,pageSize,totals:result.totals,
      hasMoreAssignments:page*pageSize<result.totals.assignments,
      hasMoreQuizzes:page*pageSize<result.totals.quizzes}}:{}),
  };
}
