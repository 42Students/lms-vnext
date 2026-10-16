/** LEARNER-learning-misc-08: only a grade actually published by faculty may notify.
 * Do not place points or hidden feedback in the notice. */
export function learnerAssignmentPublishedNotice(assignmentId:string,deliveryId:string){
 return {
  title:"Assignment grade published",
  body:"Your assignment grade is available. Open your submission to see the published result.",
  actionHref:"/learn/allAssignments/"+encodeURIComponent(assignmentId)+
   "?deliveryId="+encodeURIComponent(deliveryId),
 };
}
