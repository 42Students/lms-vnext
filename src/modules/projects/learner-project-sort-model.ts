import { z } from "zod";
const sortSchema=z.enum(["RECENT","TITLE","PROGRESS"]).catch("RECENT");
type Row={project:{id:string;title:string;status:string;updatedAt:Date}};

/** Legacy lists numbered teams naturally, so Team 2 sorts before Team 10. */
export function compareNumberedTeamProjects(left:string,right:string):number {
 // Two numbered teams sort naturally only within the same title series.
 // "Project A Team 10" must not reorder "Project B Team 2".
 const series=(title:string)=>{
  const match=/^(.*?)(?:\s*[-—:]?\s*)\bteam\s+(\d+)\b(.*)$/i.exec(title.trim());
  return match ? {key:match[1].trim().toLowerCase()+"|"+match[3].trim().toLowerCase(),
   number:Number(match[2])} : null;
 };
 const l=series(left),r=series(right);
 return l&&r&&l.key===r.key&&Number.isFinite(l.number)&&Number.isFinite(r.number)
  ?l.number-r.number:0;
}

/** Sort already membership-scoped project rows without changing the visibility set. */
export function sortLearnerProjectRows<T extends Row>(
  rows:readonly T[],modeInput:unknown,
  progress:ReadonlyMap<string,{percentage:number|null}>,
):T[] {
 const mode=sortSchema.parse(modeInput);
 // Preserve the scoped backend order for unrelated projects, even when
 // timestamps tie or arrive in nonchronological order.
 const originalIndex=new Map<string,number>(
  rows.map((row,index):[string,number]=>[row.project.id,index]),
 );
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
  return (originalIndex.get(a.project.id)??0)-(originalIndex.get(b.project.id)??0);
 });
}
