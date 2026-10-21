
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

export function mentorRequiredResourceLinkState(resource:{
 required:boolean;url:string|null;description:string|null;
}):"NOT_REQUIRED"|"SAFE_LINK"|"TEXT_ONLY"|"LINK_UNAVAILABLE"{
 if(!resource.required)return "NOT_REQUIRED";
 if(safeProjectExternalHref(resource.url))return "SAFE_LINK";
 return resource.description?.trim()?"TEXT_ONLY":"LINK_UNAVAILABLE";
}

/** Derived only from the rows already loaded by the authorized Project workspace. */
export function buildMentorWorkspaceEvidence(input:{
 tasks:readonly {sprintId:string|null;status:string}[];
 members:readonly {role:string;isPrimary:boolean}[];
 submissions:readonly {version:number;status:string}[];
}){
 const bySprint=new Map<string,{status:string}[]>();
 for(const task of input.tasks){
  if(task.sprintId===null)continue;
  const rows=bySprint.get(task.sprintId)??[];
  rows.push({status:task.status});
  bySprint.set(task.sprintId,rows);
 }
 const tasksBySprint:Record<string,ReturnType<typeof mentorSprintTaskFacts>>={};
 for(const [sprintId,tasks] of bySprint)tasksBySprint[sprintId]=mentorSprintTaskFacts(tasks);
 return {tasksBySprint,team:mentorWorkspaceTeamFacts(input.members),
  latestDelivery:mentorLatestDeliveryVersion(input.submissions)};
}

/** The source readiness proof coverage denominator counts only completed
 * tasks. A task with a safe URL or submitted artifact counts once, and zero
 * completed tasks yields 0 rather than a misleading 100%. */
export function legacyTaskEvidenceCoverage(tasks:readonly {
 id:string;status:string;deletedAt?:Date|null;
 submissionUrl?:string|null;
}[]){
 const done=tasks.filter(task=>task.status==="DONE"&&!task.deletedAt);
 const proved=done.filter(task=>safeProjectExternalHref(task.submissionUrl??null)!==null).length;
 return {completedTasks:done.length,completedWithEvidence:proved,
  percentage:done.length?Math.round(100*proved/done.length):0};
}
