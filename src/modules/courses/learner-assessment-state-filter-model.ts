import { z } from "zod";
export const LEARNER_ASSESSMENT_STATE_OPTIONS=[
  {value:"ALL",label:"All states"},
  {value:"PENDING",label:"Needs action"},
  {value:"DUE_SOON",label:"Due within 72 hours"},
  {value:"OVERDUE",label:"Overdue / missed"},
  {value:"COMPLETED",label:"Submitted / attempted"},
  {value:"RESULTS",label:"Feedback / results published"},
] as const;
export type LearnerAssessmentStateFilter=(typeof LEARNER_ASSESSMENT_STATE_OPTIONS)[number]["value"];
const filterSchema=z.enum(["ALL","PENDING","DUE_SOON","OVERDUE","COMPLETED","RESULTS"]);
type Assignment={kind:"ASSIGNMENT";submittedAt:string|null;gradePublished:boolean;dueAt?:string|null};
type Quiz={kind:"QUIZ";attemptsUsed:number;attemptsRemaining:number;status:"PUBLISHED"|"CLOSED";dueAt:string|null;resultsPublished:boolean};
export function learnerAssessmentMatchesState(
  item:Assignment|Quiz, rawFilter:unknown, snapshotNowMs:number,
):boolean {
  const filter=filterSchema.catch("ALL").parse(rawFilter);
  if(filter==="ALL")return true;
  const completed=item.kind==="ASSIGNMENT" ? Boolean(item.submittedAt) : item.attemptsUsed>0;
  if(filter==="COMPLETED")return completed;
  if(filter==="RESULTS")return completed && (item.kind==="ASSIGNMENT" ? item.gradePublished : item.resultsPublished);
  if(filter==="OVERDUE"){
    if(completed)return false;
    const due=item.dueAt?Date.parse(item.dueAt):Number.NaN;
    if(item.kind==="ASSIGNMENT")return Number.isFinite(due) && due<snapshotNowMs;
    return item.status==="CLOSED" || (Number.isFinite(due) && due<snapshotNowMs);
  }
  if(filter==="DUE_SOON"){
    if(completed || !item.dueAt)return false;
    const due=Date.parse(item.dueAt);
    if(!Number.isFinite(due) || due<snapshotNowMs || due>snapshotNowMs+72*60*60*1000)return false;
    return item.kind==="ASSIGNMENT" || (item.status==="PUBLISHED" && item.attemptsRemaining>0);
  }
  if(item.kind==="ASSIGNMENT")return !completed;
  const deadline=item.dueAt ? new Date(item.dueAt).getTime() : null;
  return !completed && item.attemptsRemaining>0 && item.status==="PUBLISHED" &&
    (deadline===null || (Number.isFinite(deadline) && deadline>=snapshotNowMs));
}
