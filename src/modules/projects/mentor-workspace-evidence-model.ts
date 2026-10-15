
export function safeProjectExternalHref(raw:string|null):string|null {
  if (!raw || raw.length>2048) return null;
  try {
    const url=new URL(raw);
    if(!["http:","https:"].includes(url.protocol)||url.username||url.password) return null;
    return url.toString();
  } catch { return null; }
}

export function showMentorTaskCriteria(mode:"LEARNER"|"MENTOR"|"ADMIN",criteria:string|null){
  return (mode==="LEARNER"||mode==="MENTOR")&&Boolean(criteria?.trim());
}

export function mentorSprintTaskFacts(tasks:readonly {status:string}[]) {
  const total=tasks.length;
  const done=tasks.filter(row=>row.status==="DONE").length;
  const blocked=tasks.filter(row=>row.status==="BLOCKED").length;
  const inReview=tasks.filter(row=>row.status==="IN_REVIEW").length;
  return {total,done,blocked,inReview,
    completionPercent:total===0?null:Math.round(100*done/total)};
}

export function mentorSprintEmptyWorkNotice(status:string, tasks:readonly unknown[]) {
  if(tasks.length!==0)return null;
  return status==="COMPLETED"
    ? "This completed Sprint has no recorded tasks; no execution percentage is inferred."
    : "No tasks have been recorded for this Sprint.";
}

export function mentorTaskReviewEvidence(
 taskStatus:string, latest:{status:string;version:number}|null
):"REVIEW_PENDING"|"NO_SUBMISSION"|"RECORDED"|"UNMATCHED" {
  if(taskStatus==="IN_REVIEW"&&latest?.status==="SUBMITTED")return "REVIEW_PENDING";
  if(!latest)return "NO_SUBMISSION";
  if(taskStatus==="IN_REVIEW")return "UNMATCHED";
  return "RECORDED";
}

export function mentorTaskFeedbackHref(projectId:string,taskId:string){
  return "/mentor/projects/"+encodeURIComponent(projectId)+"/tasks/"+
    encodeURIComponent(taskId)+"/feedback";
}

export function mentorWorkspaceTeamFacts(members:readonly {role:string;isPrimary:boolean}[]){
  return {learners:members.filter(row=>row.role==="LEARNER").length,
    mentors:members.filter(row=>row.role==="MENTOR").length,
    primaryMentors:members.filter(row=>row.role==="MENTOR"&&row.isPrimary).length};
}

export function mentorWorkspaceMissingPrimaryMentor(
 projectStatus:string,members:readonly {role:string;isPrimary:boolean}[]
){
  return projectStatus!=="ARCHIVED"&&
    !members.some(row=>row.role==="MENTOR"&&row.isPrimary);
}

export function mentorLatestDeliveryVersion(
 submissions:readonly {version:number;status:string}[]
):{version:number;status:string}|null{
  if(!submissions.length)return null;
  return submissions.reduce((latest,row)=>row.version>latest.version?row:latest);
}
