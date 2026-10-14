import "server-only";

import { can } from "@/modules/permissions/policy";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import { getFacultyAssessmentOverview } from "./faculty-assessment-service";
import {
  getFacultyAssignmentReport, getFacultyQuizReport,
} from "./faculty-assessment-report-service";
import {
  facultyResultsQuerySchema, filterFacultyResultCandidates,
  paginateFacultyResults, type FacultyResultCandidate,
} from "./faculty-results-model";

/**
 * A bounded read-first summary. The existing report readers perform a second
 * active teaching-scope check for each chosen Section and assessment.
 */
export async function getFacultyAssessmentResults(
  context: RequestContext, rawQuery: unknown,
) {
  const query = facultyResultsQuerySchema.parse(rawQuery);
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context,"FACULTY") ||
      !can(context,"courses.read",{
        collegeId: membership.collegeId, organizationId: membership.organizationId,
      })) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }
  const overview = await getFacultyAssessmentOverview(context);
  const candidates: FacultyResultCandidate[] = [
    ...overview.assignments.map(row => ({
      id:row.id, kind:"ASSIGNMENT" as const, status:row.status,
      title:row.title, courseName:row.courseName, sectionName:row.sectionName,
      deliveryId:row.deliveryId, dueAt:row.dueAt,
    })),
    ...overview.quizzes.map(row => ({
      id:row.id, kind:"QUIZ" as const, status:row.status,
      title:row.title, courseName:row.courseName, sectionName:row.sectionName,
      deliveryId:row.deliveryId, dueAt:row.dueAt,
    })),
  ];
  const chosen = paginateFacultyResults(
    filterFacultyResultCandidates(candidates,query),query.page,
  );
  const items = await Promise.all(chosen.items.map(async row => {
    if (row.kind === "ASSIGNMENT") {
      const report = await getFacultyAssignmentReport(context,row.id,row.deliveryId);
      return {
        ...row,
        eligible:report.metrics.eligibleLearners,
        responded:report.metrics.submitted,
        pending:report.metrics.missing,
        averagePercent:report.metrics.averagePercent,
        published:report.metrics.gradePublished,
        reportHref:"/teacher/report/assignment/"+encodeURIComponent(row.id)+
          "?deliveryId="+encodeURIComponent(row.deliveryId),
      };
    }
    const report = await getFacultyQuizReport(context,row.id,row.deliveryId);
    return {
      ...row,
      eligible:report.metrics.eligibleLearners,
      responded:report.metrics.submittedLearners,
      pending:report.metrics.notAttempted,
      averagePercent:report.metrics.averagePercent,
      published:null,
      reportHref:"/teacher/report/quiz/"+encodeURIComponent(row.id)+
        "?deliveryId="+encodeURIComponent(row.deliveryId),
    };
  }));
  return {query,...chosen,items,sections:overview.courses};
}
