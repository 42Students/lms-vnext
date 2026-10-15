/** Changing filters must not retain a drawer for an item outside visible own-course scope. */
export function learnerAssessmentDrawerSelectionAllowed(
 key:string|null,
 visible:readonly {kind:"ASSIGNMENT"|"QUIZ";id:string;deliveryId:string}[],
):boolean{
 return key!==null && visible.some(item =>
  item.kind==="ASSIGNMENT" && `${item.deliveryId}:${item.id}`===key);
}
