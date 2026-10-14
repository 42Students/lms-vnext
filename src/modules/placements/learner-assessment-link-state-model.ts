export type LearnerAssessmentLinkSource={testUrl:string|null};
/** Only valid browser web URLs are actionable employer assessment links. */
export function learnerAssessmentLinkState(row:LearnerAssessmentLinkSource):"READY"|"MISSING"{
 if(!row.testUrl)return "MISSING";
 try{const url=new URL(row.testUrl);
   return url.protocol==="https:"||url.protocol==="http:"?"READY":"MISSING";
 }catch{return "MISSING";}
}
export function filterLearnerAssessmentsMissingLink<T extends LearnerAssessmentLinkSource>(rows:readonly T[]):T[]{
 return rows.filter(row=>learnerAssessmentLinkState(row)==="MISSING");
}
