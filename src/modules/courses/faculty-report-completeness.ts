/** FAC-assessments-28: a report is incomplete when not every enrolled learner
 * has a result, or assignments still need grading. Never silently label a
 * partially sampled or empty cohort report as final. */
export function facultyReportIsIncomplete(input:
  | {kind:"quiz";eligibleLearners:number;submittedLearners:number;questionCount:number}
  | {kind:"assignment";eligibleLearners:number;submitted:number;graded:number}
):boolean {
  const counts=input.kind==="quiz"
    ? [input.eligibleLearners,input.submittedLearners,input.questionCount]
    : [input.eligibleLearners,input.submitted,input.graded];
  if(counts.some(n=>!Number.isSafeInteger(n)||n<0))return true;
  if(input.eligibleLearners===0)return true;
  if(input.kind==="quiz")return input.questionCount===0 ||
    input.submittedLearners!==input.eligibleLearners;
  return input.submitted!==input.eligibleLearners || input.graded!==input.submitted;
}
