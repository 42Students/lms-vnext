import type {TpoStudentSummary} from "./tpo-students-model";
/** Counts reflect the entire currently authorized college/batch working set. */
export function tpoStudentJourneySteps(s:TpoStudentSummary){
 const base=Math.max(0,s.activeLearners);
 const pct=(count:number)=>base?Math.round(count*10000/base)/100:0;
 return [
  {label:"In placements",count:s.activeLearners,percent:pct(s.activeLearners)},
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

/** Five milestones in the uploaded Students > All students prototype. The old
 * summary does not include a verified Education+Identity total, so only the
 * complete authorized snapshot may supply that number. Unknown is NOT zero. */
export function tpoStudentPrototypeJourneySteps(
 summary:TpoStudentSummary,verifiedCount:number|null,
){
 const basis=summary.activeLearners;
 const verified=verifiedCount!==null&&Number.isSafeInteger(verifiedCount)&&
  verifiedCount>=0&&verifiedCount<=basis?verifiedCount:null;
 const fraction=(value:number|null)=>
  value===null||basis===0?null:Math.round(value*10000/basis)/100;
 return [
  {key:"ELIGIBLE",label:"Eligible",count:basis,percent:fraction(basis)},
  {key:"REGISTERED",label:"Registered",count:summary.placementPool,percent:fraction(summary.placementPool)},
  {key:"VERIFIED",label:"Verified",count:verified,percent:fraction(verified)},
  {key:"APPLYING",label:"Applying",count:summary.applying,percent:fraction(summary.applying)},
  {key:"PLACED",label:"Placed",count:summary.placed,percent:fraction(summary.placed)},
 ] as const;
}
/** Only an exactly complete in-scope roster snapshot with explicit document
 * states can prove a verified total; pagination and UNKNOWN records cannot. */
export function tpoStudentVerifiedSnapshotCount(input:{
 expectedTotal:number;
 rows:readonly {verification:{status:string}}[]|null;
}):number|null{
 if(input.rows===null||!Number.isSafeInteger(input.expectedTotal)||input.expectedTotal<0||
   input.rows.length!==input.expectedTotal||
   input.rows.some(row=>row.verification.status==="UNKNOWN"))return null;
 return input.rows.filter(row=>row.verification.status==="VERIFIED").length;
}
