import { z } from "zod";
const sortSchema=z.enum(["RECENT","TITLE","PROGRESS"]).catch("RECENT");
type Row={project:{id:string;title:string;status:string;updatedAt:Date}};

/** Legacy lists numbered teams naturally, so Team 2 sorts before Team 10. */
export function compareNumberedTeamProjects(left:string,right:string):number {
 const l=/\\bteam\\s+(\\d+)\\b/i.exec(left);
 const r=/\\bteam\\s+(\\d+)\\b/i.exec(right);
 if(!l||!r)return 0;
 const n=Number(l[1])-Number(r[1]);
 return n||left.localeCompare(right,undefined,{numeric:true,sensitivity:"base"});
}

/** Sort already membership-scoped project rows without changing the visibility set. */
export function sortLearnerProjectRows<T extends Row>(
  rows:readonly T[],modeInput:unknown,
  progress:ReadonlyMap<string,{percentage:number|null}>,
):T[] {
 const mode=sortSchema.parse(modeInput);
 return [...rows].sort((a,b)=>{
  const archived=Number(a.project.status==="ARCHIVED")-Number(b.project.status==="ARCHIVED");
  if(archived)return archived;
  if(mode==="TITLE")return a.project.title.localeCompare(b.project.title,undefined,{numeric:true})||a.project.id.localeCompare(b.project.id);
  if(mode==="PROGRESS"){
   const x=progress.get(a.project.id)?.percentage;
   const y=progress.get(b.project.id)?.percentage;
   if(x==null&&y!=null)return 1;
   if(y==null&&x!=null)return -1;
   if(x!=null&&y!=null&&x!==y)return x-y;
  }
  const numbered=compareNumberedTeamProjects(a.project.title,b.project.title);
  if(numbered)return numbered;
  return b.project.updatedAt.getTime()-a.project.updatedAt.getTime()||
   a.project.id.localeCompare(b.project.id);
 });
}
