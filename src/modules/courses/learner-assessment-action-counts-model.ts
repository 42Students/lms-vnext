import {learnerAssessmentMatchesState} from "./learner-assessment-state-filter-model";
type Assignment={kind:"ASSIGNMENT";submittedAt:string|null;gradePublished:boolean;dueAt?:string|null};
type Quiz={kind:"QUIZ";attemptsUsed:number;attemptsRemaining:number;status:"PUBLISHED"|"CLOSED";dueAt:string|null;resultsPublished:boolean};
/** Counts are derived from the same state policy as aggregate filters. */
export function learnerAssessmentActionCounts(
 rows:readonly (Assignment|Quiz)[],nowMs:number,
):{pending:number;overdue:number}{
 let pending=0,overdue=0;
 for(const row of rows){
  if(learnerAssessmentMatchesState(row,"PENDING",nowMs))pending++;
  if(learnerAssessmentMatchesState(row,"OVERDUE",nowMs))overdue++;
 }
 return {pending,overdue};
}
