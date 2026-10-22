import "server-only";

import { can, AuthorizationError } from "@/modules/permissions/policy";
import { hasActiveMembership,hasMembershipRole,type RequestContext } from "@/modules/identity/context";
import { getFacultyCourseWorkspace } from "./faculty-course-service";
import { getFacultyQuizReport } from "./faculty-assessment-report-service";
import { facultyQuizAttemptsPage, facultyQuizAttemptsQuerySchema, facultySearchQuizAttempts } from "./faculty-quiz-attempts-model";

/** Normalize the legacy comma-delimited option IDs and current JSON arrays
 * for faculty report DTOs. An imported integer ID must be resolved by the
 * migration map, never guessed from another quiz at reporting time. */
function selectedOptionIdsForReport(value:unknown):string[]{
  const raw=Array.isArray(value)?value:typeof value==="string"?value.split(","):[];
  return raw.flatMap(item=>{
    if(typeof item!=="string"&&!(typeof item==="number"&&Number.isSafeInteger(item)))return [];
    const id=String(item).trim();
    return id?[id]:[];
  });
}

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
      // Learner choices are available only in the authorized Faculty drilldown.
      questionResults:attempt.answers.map(answer=>({
        questionId:answer.questionId,
        selectedOptionIds:selectedOptionIdsForReport(answer.selectedOptionIds),
        correct:answer.correct,
        pointsAwarded:answer.pointsAwarded,
        pointsPossible:answer.pointsPossible,
      })),
    })),
  };
}
