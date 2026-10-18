import {z} from "zod";

export const facultyLiveClassesQuerySchema=z.object({
 view:z.enum(["UPCOMING","PAST","ALL"]).default("UPCOMING"),
 deliveryId:z.string().uuid().optional(),
 page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type FacultyLiveClassesQuery=z.infer<typeof facultyLiveClassesQuerySchema>;

export function safeHttpsMeetingLink(value:string|null|undefined):string|null {
 if(!value)return null;
 try{
  const u=new URL(value.trim());
  if(u.protocol!=="https:"||!u.hostname||u.username||u.password)return null;
  if(u.hostname==="localhost"||u.hostname.endsWith(".localhost"))return null;
  return u.href;
 }catch{return null;}
}
export type FacultyLiveClass={
 id:string;deliveryId:string;courseName:string;sectionName:string;
 title:string;startsAt:Date;endsAt:Date;joinUrl:string|null;
 status:string;updatedAt?:Date;
};
export function pageFacultyLiveClasses(
 sessions:readonly FacultyLiveClass[],query:FacultyLiveClassesQuery,now:Date,
){
 const filtered=sessions.filter(s=>
  (!query.deliveryId||s.deliveryId===query.deliveryId) &&
  (query.view==="ALL"||
   (query.view==="UPCOMING"&&s.endsAt.getTime()>=now.getTime())||
   (query.view==="PAST"&&s.endsAt.getTime()<now.getTime()))
 ).sort((a,b)=>{
   const safeTime = (date: Date) => {
     const value = date.getTime();
     return Number.isFinite(value) ? value : 0;
   };
   const diff=query.view==="PAST"?
     safeTime(b.startsAt)-safeTime(a.startsAt):safeTime(a.startsAt)-safeTime(b.startsAt);
   return diff || a.id.localeCompare(b.id);
 });
 const total=filtered.length,pageSize=20,totalPages=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.min(query.page,totalPages);
 return {total,page,pageSize,totalPages,items:filtered.slice((page-1)*pageSize,page*pageSize)};
}
export function facultyLiveClassesHref(query:FacultyLiveClassesQuery){
 const params=new URLSearchParams();
 if(query.view!=="UPCOMING")params.set("view",query.view);
 if(query.deliveryId)params.set("deliveryId",query.deliveryId);
 if(query.page>1)params.set("page",String(query.page));
 return "/teacher/live-classes"+(params.size?"?"+params.toString():"");
}

/**
 * Reading every assigned Section at once can exhaust the database pool for
 * Faculty teaching many Sections. Retain stable UI ordering but constrain
 * in-flight workspace queries to at most eight.
 */
export async function mapFacultyLiveWorkspacesInBatches<T,U>(
  inputs:readonly T[],mapper:(input:T)=>Promise<U>,concurrency=8,
):Promise<U[]>{
  if(!Number.isSafeInteger(concurrency)||concurrency<1||concurrency>8)
    throw new RangeError("INVALID_FACULTY_LIVE_WORKSPACE_CONCURRENCY");
  const output:U[]=[];
  for(let start=0;start<inputs.length;start+=concurrency){
    const batch=await Promise.all(inputs.slice(start,start+concurrency).map(mapper));
    output.push(...batch);
  }
  return output;
}
