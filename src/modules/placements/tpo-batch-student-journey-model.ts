/** Keep eligibility and consent-based registration numerators separate.
 * A sample of 500 learner eligibility decisions is never a full-cohort KPI. */
export function studentJourneyForBatch(input:{
 total:number;eligible:number;undecided:number;assessed:number;complete:boolean;
 registered:number|null;registrationAvailable:boolean;
}){
 const total=Math.max(0,input.total),eligible=input.complete?input.eligible:null;
 const registered=input.registrationAvailable?input.registered:null;
 return {
  total,eligible,registered,undecided:input.complete?input.undecided:null,
  notInvited:eligible===null||registered===null?null:Math.max(0,eligible-registered),
  registrationGap:registered===null?null:Math.max(0,total-registered),
  sampled:!input.complete,sampleCount:input.assessed,
 };
}
