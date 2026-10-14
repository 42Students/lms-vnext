import { z } from "zod";
export const LEARNER_ASSESSMENT_STATE_OPTIONS=[
  {value:"ALL",label:"All states"},
  {value:"PENDING",label:"Needs action"},
  {value:"COMPLETED",label:"Submitted / attempted"},
  {value:"RESULTS",label:"Feedback / results published"},
] as const;
export type LearnerAssessmentStateFilter=(typeof LEARNER_ASSESSMENT_STATE_OPTIONS)[number]["value"];
const filterSchema=z.enum(["ALL","PENDING","COMPLETED","RESULTS"]);
type Assignment={kind:"ASSIGNMENT";submittedAt:string|null;gradePublished:boolean};
type Quiz={kind:"QUIZ";attemptsUsed:number;attemptsRemaining:number;status:"PUBLISHED"|"CLOSED";dueAt:string|null;resultsPublished:boolean};
export function learnerAssessmentMatchesState(
  item:Assignment|Quiz, rawFilter:unknown, snapshotNowMs:number,
):boolean {
  const filter=filterSchema.catch("ALL").parse(rawFilter);
  if(filter==="ALL")return true;
  const completed=item.kind==="ASSIGNMENT" ? Boolean(item.submittedAt) : item.attemptsUsed>0;
  if(filter==="COMPLETED")return completed;
  if(filter==="RESULTS")return completed && (item.kind==="ASSIGNMENT" ? item.gradePublished : item.resultsPublished);
  if(item.kind==="ASSIGNMENT")return !completed;
  const deadline=item.dueAt ? new Date(item.dueAt).getTime() : null;
  return !completed && item.attemptsRemaining>0 && item.status==="PUBLISHED" &&
    (deadline===null || (Number.isFinite(deadline) && deadline>=snapshotNowMs));
}
