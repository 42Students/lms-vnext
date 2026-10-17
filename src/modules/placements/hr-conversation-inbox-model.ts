import {z} from "zod";
export const hrConversationQuerySchema=z.object({
 collegeId:z.string().uuid().optional(),
 q:z.string().trim().max(120).default(""),
 page:z.union([z.number().int(),z.string().regex(/^[1-9][0-9]*$/).transform(Number)])
  .pipe(z.number().int().min(1).max(10000)).default(1),
 unreadOnly:z.enum(["true","false"]).default("false"),
 sort:z.enum(["LATEST","OLDEST"]).default("LATEST"),
 scope:z.enum(["ALL","GENERAL","DRIVE"]).default("ALL"),
}).strict();
export function filterRecruiterConversations<T extends {jobId:string|null;id:string}>(
 threads:readonly T[], jobIds:ReadonlySet<string>, query:string,
 titles:ReadonlyMap<string,string>=new Map(),
 messageMatchedIds:ReadonlySet<string>=new Set(),
):T[]{
 const needle=query.trim().toLowerCase();
 return threads.filter(thread=>!thread.jobId || jobIds.has(thread.jobId))
  .filter(thread=>!needle || messageMatchedIds.has(thread.id) || thread.jobId?.toLowerCase().includes(needle) || thread.id.toLowerCase().includes(needle) ||
    (thread.jobId?titles.get(thread.jobId)?.toLowerCase().includes(needle)===true:false));
}

export const HR_CONVERSATION_PAGE_SIZE=20;
export function hrConversationPageBounds(page:number,total:number){
 const pages=Math.max(1,Math.ceil(total/HR_CONVERSATION_PAGE_SIZE));
 const currentPage=Math.max(1,Math.min(page,pages));
 return {page:currentPage,pages,
  first:total?(currentPage-1)*HR_CONVERSATION_PAGE_SIZE+1:0,
  last:Math.min(total,currentPage*HR_CONVERSATION_PAGE_SIZE)};
}

export function onlyUnreadRecruiterThreads<T extends {id:string}>(
 rows:readonly T[],unreadIds:ReadonlySet<string>,enabled:boolean,
):T[]{return enabled?rows.filter(row=>unreadIds.has(row.id)):[...rows];}

export function orderRecruiterConversations<T extends {
 id:string;lastMessageAt:Date|null;createdAt:Date;
}>(rows:readonly T[],order:"LATEST"|"OLDEST"):T[]{
 return [...rows].sort((a,b)=>{
  const left=(a.lastMessageAt??a.createdAt).getTime();
  const right=(b.lastMessageAt??b.createdAt).getTime();
  const delta=order==="LATEST"?right-left:left-right;
  return delta||a.id.localeCompare(b.id);
 });
}

export function scopeRecruiterConversations<T extends {jobId:string|null}>(
 rows:readonly T[],scope:"ALL"|"GENERAL"|"DRIVE",
):T[] {
 return rows.filter(row=>scope==="ALL"||
  (scope==="GENERAL"?row.jobId===null:row.jobId!==null));
}

export function countScopedConversations<T>(rows:readonly T[]):number{
 return rows.length;
}
