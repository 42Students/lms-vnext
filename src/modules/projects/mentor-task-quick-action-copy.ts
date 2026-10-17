export function mentorTaskQuickActionLabel(status:string){
 switch(status){
  case "IN_PROGRESS":return "Move to in progress";
  case "BLOCKED":return "Flag as blocked";
  case "IN_REVIEW":return "Move to review";
  case "DONE":return "Mark complete";
  default:return "Move to do";
 }
}
