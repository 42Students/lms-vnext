/** Learner notification content contains no private reviewer feedback or contact data. */
export function learnerProjectTaskReviewNotice(input:{
 projectId:string;taskId:string;decision:"APPROVED"|"CHANGES_REQUESTED"|"REJECTED" | string;
}){
 const approved=input.decision==="APPROVED";
 return {
  title:approved?"Task approved":"Changes requested on your task",
  body:approved?"Your task is completed after mentor review.":
   "Your mentor has asked for changes. Open the task to review and resubmit.",
  actionHref:"/learn/projects/"+encodeURIComponent(input.projectId)+
    "?tab=board&taskId="+encodeURIComponent(input.taskId),
 };
}

/** Final delivery belongs to the team, not only the member who pressed Submit. */
export function learnerProjectDeliveryReviewNotice(projectId:string,decision:string){
 const approved=decision==="APPROVED";
 return {
  title:approved?"Delivery accepted":"Changes requested",
  body:approved?"Your team's final delivery was accepted. Open it to view the review.":
   "Changes were requested on your team's final delivery. Open it to read the feedback.",
  actionHref:"/learn/projects/"+encodeURIComponent(projectId)+"?tab=delivery",
 };
}

/** Reopen notices link to the authorized delivery view, not directly to stored feedback. */
export function learnerProjectDeliveryReopenedNotice(projectId:string){
 return {
  title:"Delivery reopened for revision",
  body:"The final delivery was reopened. Review the reason and prepare an updated version.",
  actionHref:"/learn/projects/"+encodeURIComponent(projectId)+"?tab=delivery",
 };
}
