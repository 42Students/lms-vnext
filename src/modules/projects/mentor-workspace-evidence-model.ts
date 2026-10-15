
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
