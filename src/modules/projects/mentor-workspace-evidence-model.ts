
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
