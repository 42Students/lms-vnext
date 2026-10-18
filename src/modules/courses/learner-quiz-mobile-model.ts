import type {LearnerQuizOverviewItem} from "@/components/courses/learner-assessment-overview";

/** Only quiz attempts/status and explicitly published results may inform the mobile label. */
export function learnerQuizMobileState(
  quiz:Pick<LearnerQuizOverviewItem,
    "status"|"resultsPublished"|"attemptsUsed"|"attemptsRemaining"|"maxAttempts"|"dueAt">,
  nowMs:number,
){
  if(quiz.resultsPublished && quiz.attemptsUsed>0){
    return {label:"Results available",detail:"Open attempt history to review published results",urgent:false};
  }
  if(quiz.dueAt===null && quiz.attemptsUsed===0) return {
    label:"Unavailable",detail:"Quiz deadline is not configured",urgent:false,
  };
  const date=quiz.dueAt===null?null:Date.parse(quiz.dueAt);
  const deadlinePassed=date!==null&&Number.isFinite(date)&&date<=nowMs;
  if(quiz.status==="CLOSED"||deadlinePassed){
    return {label:"Closed",detail:quiz.attemptsUsed>0
      ? "Previous attempts remain in history; results may be unpublished"
      : "No attempt available after closing",urgent:false};
  }
  if(quiz.attemptsRemaining===0){
    return {label:"Attempts used",detail:"Result visibility depends on faculty publication",urgent:false};
  }
  return {label:"Ready to attempt",detail:quiz.attemptsRemaining+" of "+
    quiz.maxAttempts+" attempts remaining",urgent:date!==null&&Number.isFinite(date)&&
    date-nowMs>=0&&date-nowMs<=86_400_000};
}
