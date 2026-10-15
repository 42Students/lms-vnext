export function summarizeBatchStudentEvidence(rows:readonly {decision:string;ambiguous:boolean;source:string}[]) {
 return rows.reduce((acc,row)=>{
  acc.assessed++;
  if(row.ambiguous)acc.needsReview++;
  else if(row.decision==="ELIGIBLE")acc.eligible++;
  else if(row.decision==="INELIGIBLE")acc.ineligible++;
  else acc.undecided++;
  if(row.source==="LEARNER")acc.directOverrides++;
  return acc;
 },{assessed:0,eligible:0,ineligible:0,undecided:0,needsReview:0,directOverrides:0});
}
