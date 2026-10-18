import "server-only";

import { can, AuthorizationError } from "@/modules/permissions/policy";
import { hasActiveMembership,hasMembershipRole,type RequestContext } from "@/modules/identity/context";
import { getFacultyCourseWorkspace } from "./faculty-course-service";
import { getFacultyQuizReport } from "./faculty-assessment-report-service";
import { facultyQuizAttemptsPage, facultyQuizAttemptsQuerySchema, facultySearchQuizAttempts } from "./faculty-quiz-attempts-model";

/** Faculty-only attempt analysis, guarded by the exact live teaching delivery. */
export async function getFacultyQuizAttemptDrilldown(context:RequestContext,raw:unknown) {
  const query=facultyQuizAttemptsQuerySchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
    !can(context,"courses.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new AuthorizationError("courses.read");
  await getFacultyCourseWorkspace(context,query.deliveryId);
  const report=await getFacultyQuizReport(context,query.quizId,query.deliveryId);
  const page=facultyQuizAttemptsPage(facultySearchQuizAttempts(query.view==="LATEST"?report.latestAttempts:report.attempts,query.q),query.page,query.order);
  return {
    query,quiz:report.quiz,questions:report.questions,
    ...page,
    items:page.items.map(attempt=>({
      id:attempt.id,
      learnerName:attempt.learnerDisplayName?.trim()||"Learner",
      attemptNumber:attempt.attemptNumber,
      submittedAt:attempt.submittedAt,
      score:attempt.score,
      maxScore:attempt.maxScore,
      answered:attempt.answers.length,
      correct:attempt.answers.filter(answer=>answer.correct).length,
      // Individual option selections are withheld from this summary view.
      questionResults:attempt.answers.map(answer=>({
        questionId:answer.questionId,
        correct:answer.correct,
        pointsAwarded:answer.pointsAwarded,
        pointsPossible:answer.pointsPossible,
      })),
    })),
  };
}
