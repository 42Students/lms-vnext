import {learnerAssessmentLinkState,type LearnerAssessmentLinkSource} from "./learner-assessment-link-state-model";
type Round=LearnerAssessmentLinkSource & {scheduledAt:string|null;exception:{scheduledAt:string}|null};
/** No authored LMS round time is NOT a statement about the employer deadline. */
export function learnerAssessmentMissingSchedule(rows:readonly Round[]){
 const missing=rows.filter(row=>{
  const saved=row.exception?.scheduledAt??row.scheduledAt;
  return !saved || !Number.isFinite(Date.parse(saved));
 });
 return {
  count:missing.length,
  missingLinkCount:missing.filter(row=>learnerAssessmentLinkState(row)==="MISSING").length,
  notice:"No round date is recorded in your college schedule. The employer may still set a separate deadline. Check official instructions before assuming no deadline applies.",
 };
}
