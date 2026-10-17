/** TPO-batches-03: old placement-state words use real effective eligibility. */
export function tpoBatchPlacementState(input:{
 finishedAt:Date|null;eligible:number|null;
}):"Finished"|"In placements"|"Not started"{
 if(input.finishedAt)return "Finished";
 return (input.eligible??0)>0?"In placements":"Not started";
}
