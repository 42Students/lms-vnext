export type LearnerApplicationTimelineInput={
  applicationId:string;submittedAt:Date;withdrawnAt:Date|null;
  screening:{status:string;decidedAt:Date|null};
  results:readonly {resultId:string;roundName:string;outcome:string;appliedAt:Date|null}[];
};
/** Timeline is a projection of actual saved timestamps, not a synthetic audit trail. */
export function learnerApplicationJourneyTimeline(input:LearnerApplicationTimelineInput){
  const events:{key:string;at:Date;label:string}[]=[
    {key:"submitted",at:input.submittedAt,label:"Application submitted"},
  ];
  if(input.screening.decidedAt&&input.screening.status!=="UNDER_REVIEW"){
    events.push({key:"screening",at:input.screening.decidedAt,
      label:"Screening: "+input.screening.status.replaceAll("_"," ").toLowerCase()});
  }
  for(const result of input.results){
    if(!result.appliedAt)continue;
    events.push({key:"round:"+result.resultId,at:result.appliedAt,
      label:result.roundName+": "+result.outcome.replaceAll("_"," ").toLowerCase()});
  }
  if(input.withdrawnAt)
    events.push({key:"withdrawn",at:input.withdrawnAt,label:"Application withdrawn"});
  return events.sort((a,b)=>b.at.getTime()-a.at.getTime()||
    a.key.localeCompare(b.key));
}
