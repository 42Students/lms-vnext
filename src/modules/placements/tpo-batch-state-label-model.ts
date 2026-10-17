/** TPO-batches-03: old placement-state words use real effective eligibility. */
export function tpoBatchPlacementState(input:{
 finishedAt:Date|null;eligible:number|null;
}):"Finished"|"In placements"|"Not started"{
 if(input.finishedAt)return "Finished";
 return (input.eligible??0)>0?"In placements":"Not started";
}

/** Filter by the legacy *eligibility* state, not just whether invitations were
 * sent. Old URL parameters stay accepted for previously shared links. */
export function tpoBatchMatchesPlacementState(input:{
 finishedAt:Date|null;eligible:number|null;
},state:"ALL"|"IN_PLACEMENTS"|"NOT_STARTED"|"FINISHED"|"PLANNING"|"INVITED"){
 if(state==="ALL")return true;
 const actual=tpoBatchPlacementState(input);
 if(state==="FINISHED")return actual==="Finished";
 if(state==="IN_PLACEMENTS"||state==="INVITED")return actual==="In placements";
 return actual==="Not started";
}
