import "server-only";

import { can } from "@/modules/permissions/policy";
import {
  hasActiveMembership, hasMembershipRole, type RequestContext,
} from "@/modules/identity/context";
import { getFacultyDeliveryRoster } from "@/modules/attendance/faculty-service";
import { getFacultyAssessmentOverview } from "./faculty-assessment-service";
import {
  getFacultyAssignmentReport, getFacultyQuizReport,
} from "./faculty-assessment-report-service";
import { CoursesServiceError } from "./errors";
import {
  facultyCourseHealthParamsSchema,
  responseCoverage,
  selectFacultyCourseHealthCandidates,
  type FacultyCourseHealthCandidate,
} from "./faculty-course-health-model";

/**
 * Course-specific published assessment health for the Faculty currently
 * assigned to this exact delivery. Existing report readers recheck teaching
 * scope and persisted learner roster, and only five reports are expanded.
 */
export async function getFacultyCourseAssessmentHealth(
  context: RequestContext, rawInput: unknown,
) {
  const query = facultyCourseHealthParamsSchema.parse(rawInput);
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context,"FACULTY") ||
      !can(context,"courses.read",{
        collegeId: membership.collegeId,
        organizationId: membership.organizationId,
      })) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }
  const {delivery,roster} = await getFacultyDeliveryRoster(context,query.deliveryId);
  const overview = await getFacultyAssessmentOverview(context);
  const candidates: FacultyCourseHealthCandidate[] = [
    ...overview.assignments.map(row=>({
      id:row.id,deliveryId:row.deliveryId,title:row.title,
      kind:"ASSIGNMENT" as const,status:row.status,dueAt:row.dueAt,
    })),
    ...overview.quizzes.map(row=>({
      id:row.id,deliveryId:row.deliveryId,title:row.title,
      kind:"QUIZ" as const,status:row.status,dueAt:row.dueAt,
    })),
  ];
  const selected = selectFacultyCourseHealthCandidates(candidates,query);
  const items = await Promise.all(selected.items.map(async row => {
    if (row.kind === "ASSIGNMENT") {
      const report = await getFacultyAssignmentReport(context,row.id,query.deliveryId);
      return {
        ...row,
        responded:report.metrics.submitted,
        eligible:report.metrics.eligibleLearners,
        outstanding:report.metrics.missing,
        graded:report.metrics.graded,
        averagePercent:report.metrics.averagePercent,
        coveragePercent:responseCoverage(report.metrics.eligibleLearners,report.metrics.submitted ?? Number.NaN),
        href:"/teacher/report/assignment/"+encodeURIComponent(row.id)+
          "?deliveryId="+encodeURIComponent(query.deliveryId),
      };
    }
    const report = await getFacultyQuizReport(context,row.id,query.deliveryId);
    return {
      ...row,
      responded:report.metrics.submittedLearners,
      eligible:report.metrics.eligibleLearners,
      outstanding:report.metrics.notAttempted,
      graded:report.metrics.graded,
      averagePercent:report.metrics.averagePercent,
      coveragePercent:responseCoverage(report.metrics.eligibleLearners,report.metrics.submittedLearners ?? Number.NaN),
      href:"/teacher/report/quiz/"+encodeURIComponent(row.id)+
        "?deliveryId="+encodeURIComponent(query.deliveryId),
    };
  }));
  return {
    query,delivery,rosterSize:roster.length,
    ...selected,items,
  };
}
