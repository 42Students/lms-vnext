export type RecruiterTodayTask = {
  key: string;
  tone: "URGENT" | "SOON" | "FINE";
  title: string;
  description: string;
  href: string | null;
  at: string | null;
};

/** Browser-only Later: defer an exact task snapshot until the task changes.
 * Never write task title, message content, or recruiter PII into storage. */
export function recruiterTodayTaskFingerprint(task: RecruiterTodayTask): string {
  const text = JSON.stringify([task.key,task.tone,task.title,task.description,task.href,task.at]);
  let hash=2166136261;
  for(let i=0;i<text.length;i+=1) hash=Math.imul(hash^text.charCodeAt(i),16777619);
  return (hash>>>0).toString(16).padStart(8,"0");
}

export function readRecruiterTodayLater(raw:string|null,tasks:readonly RecruiterTodayTask[]):Record<string,string>{
  if(!raw||raw.length>16000)return {};
  let parsed:unknown;
  try{parsed=JSON.parse(raw);}catch{return {};}
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return {};
  const saved=parsed as Record<string,unknown>;
  const active:Record<string,string>={};
  for(const task of tasks){
    if(Object.keys(active).length>=50)break;
    const value=saved[task.key];
    if(typeof value==="string"&&value===recruiterTodayTaskFingerprint(task))active[task.key]=value;
  }
  return active;
}

export function putRecruiterTodayLater(
  current:Record<string,string>,task:RecruiterTodayTask,
):Record<string,string>{
  return {...current,[task.key]:recruiterTodayTaskFingerprint(task)};
}
