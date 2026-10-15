import {learnerAssessmentMatchesState} from "./learner-assessment-state-filter-model";
type Assignment={kind:"ASSIGNMENT";submittedAt:string|null;gradePublished:boolean;dueAt?:string|null};
type Quiz={kind:"QUIZ";attemptsUsed:number;attemptsRemaining:number;status:"PUBLISHED"|"CLOSED";dueAt:string|null;resultsPublished:boolean};
export const LEARNER_ASSESSMENT_QUICK_STATES=["PENDING","DUE_SOON","OVERDUE","RESULTS"] as const;
export type LearnerAssessmentQuickState=(typeof LEARNER_ASSESSMENT_QUICK_STATES)[number];
/** Counts and quick views use the exact same persisted-state policy as the filter. */
export function learnerAssessmentQuickCounts(rows:readonly (Assignment|Quiz)[],nowMs:number){
 return LEARNER_ASSESSMENT_QUICK_STATES.map(value=>({
  value,count:rows.filter(row=>learnerAssessmentMatchesState(row,value,nowMs)).length,
 }));
}
