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
