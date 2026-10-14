import "server-only";

import { can } from "@/modules/permissions/policy";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import { getFacultyAssessmentOverview } from "./faculty-assessment-service";
import {
  getFacultyAssignmentReport, getFacultyQuizReport,
} from "./faculty-assessment-report-service";
import {
  facultyResponseFollowUpPage,
  facultyResponseFollowUpQuerySchema,
  limitedMissingLearners,
  selectPastDueAssessments,
  type FacultyResponseCandidate,
} from "./faculty-response-followup-model";

/**
 * Read-first, bounded response gaps for published, past-due assessments only.
 * Both report readers recheck the exact persisted teaching Section and current
 * learner roster. This is not an outbound-notification or grading workflow.
 */
export async function getFacultyResponseFollowUps(
  context: RequestContext,
  rawQuery: unknown,
) {
  const query = facultyResponseFollowUpQuerySchema.parse(rawQuery);
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "FACULTY") ||
      !can(context, "courses.read", {
        collegeId: membership.collegeId,
        organizationId: membership.organizationId,
      })) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }

  const overview = await getFacultyAssessmentOverview(context);
  const candidates: FacultyResponseCandidate[] = [
    ...overview.assignments.map(row => ({
      id: row.id, deliveryId: row.deliveryId, title: row.title,
      kind: "ASSIGNMENT" as const, status: row.status, dueAt: row.dueAt,
      courseName: row.courseName, sectionName: row.sectionName,
    })),
    ...overview.quizzes.map(row => ({
      id: row.id, deliveryId: row.deliveryId, title: row.title,
      kind: "QUIZ" as const, status: row.status, dueAt: row.dueAt,
      courseName: row.courseName, sectionName: row.sectionName,
    })),
  ];
  const selected = facultyResponseFollowUpPage(
    selectPastDueAssessments(candidates, query, new Date()), query.page,
  );

  const items = await Promise.all(selected.items.map(async row => {
    if (row.kind === "ASSIGNMENT") {
      const report = await getFacultyAssignmentReport(context,row.id,row.deliveryId);
      const missing = limitedMissingLearners(report.missingLearners);
      return {
        ...row,
        missingCount: missing.total,
        missingPreview: missing.preview.map(student => ({
          id: student.membershipId,
          displayName: student.displayName?.trim() || "Unnamed learner",
          rollNumber: student.rollNumber,
        })),
        hiddenCount: missing.hiddenCount,
        reportHref: "/teacher/report/assignment/" + encodeURIComponent(row.id) +
          "?deliveryId=" + encodeURIComponent(row.deliveryId),
      };
    }
    const report = await getFacultyQuizReport(context,row.id,row.deliveryId);
    const missing = limitedMissingLearners(report.notAttemptedLearners);
    return {
      ...row,
      missingCount: missing.total,
      missingPreview: missing.preview.map(student => ({
        id: student.membershipId,
        displayName: student.displayName?.trim() || "Unnamed learner",
        rollNumber: student.rollNumber,
      })),
      hiddenCount: missing.hiddenCount,
      reportHref: "/teacher/report/quiz/" + encodeURIComponent(row.id) +
        "?deliveryId=" + encodeURIComponent(row.deliveryId),
    };
  }));
  return { query, ...selected, items };
}
