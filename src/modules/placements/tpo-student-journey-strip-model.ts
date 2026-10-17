import type {TpoStudentSummary} from "./tpo-students-model";
/** Counts reflect the entire currently authorized college/batch working set. */
export function tpoStudentJourneySteps(s:TpoStudentSummary){
 const base=Math.max(0,s.activeLearners);
 const pct=(count:number)=>base?Math.round(count*10000/base)/100:0;
 return [
  {label:"In placements",count:s.placementPool,percent:pct(s.placementPool)},
  {label:"Registered",count:s.placementPool,percent:pct(s.placementPool)},
  {label:"Applying",count:s.applying,percent:pct(s.applying)},
  {label:"Placed",count:s.placed,percent:pct(s.placed)},
 ];
}
export function tpoStudentJourneyGaps(s:TpoStudentSummary){
 return [
  {label:"Not registered",count:s.notRegistered,state:"NOT_REGISTERED"},
  {label:"Not applying",count:s.readyNotApplying,state:"READY_NOT_APPLYING"},
  {label:"Needs readiness support",count:s.needsReadinessSupport,state:"NEEDS_READINESS_SUPPORT"},
 ].filter(row=>row.count>0);
}
