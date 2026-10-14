import {learnerRoundScheduledInstant} from "./learner-rounds-browse-model";
type ScheduledAssessment={scheduledAt:string|null;exception:{scheduledAt:string}|null};
/** Past college schedule is not proof of missing an employer submission deadline. */
export function learnerAssessmentPastReview(rows:readonly ScheduledAssessment[],nowMs:number){
 const count=rows.filter(row=>{
  const instant=learnerRoundScheduledInstant({...row,
   applicationId:"",roundId:"",roundKind:"TEST",roundName:"",companyName:"",roleTitle:""});
  return instant!==null&&Number.isFinite(nowMs)&&instant<nowMs;
 }).length;
 return {count,notice:"The saved scheduled time has passed. This does not establish that you missed a provider deadline or completed an assessment. Official outcomes appear only after the placement team publishes applied results."};
}
