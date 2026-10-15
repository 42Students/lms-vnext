/** A stale deep-linked screening stage is not a valid filter for the
  * current membership-scoped application collection. Recover it explicitly. */
export function learnerApplicationStageSelection(allowed:readonly string[],requested:string){
 if(requested==="all"||allowed.includes(requested))return {stage:requested,stale:false};
 return {stage:"all",stale:true};
}
