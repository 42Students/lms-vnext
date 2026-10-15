import {z} from "zod";
export const hrConversationQuerySchema=z.object({
 collegeId:z.string().uuid().optional(),
 q:z.string().trim().max(120).default(""),
 page:z.coerce.number().int().min(1).max(10000).default(1),
 unreadOnly:z.enum(["true","false"]).default("false"),
}).strict();
export function filterRecruiterConversations<T extends {jobId:string|null;id:string}>(
 threads:readonly T[], jobIds:ReadonlySet<string>, query:string,
 titles:ReadonlyMap<string,string>=new Map(),
):T[]{
 const needle=query.trim().toLowerCase();
 return threads.filter(thread=>!thread.jobId || jobIds.has(thread.jobId))
  .filter(thread=>!needle || thread.jobId?.toLowerCase().includes(needle) || thread.id.toLowerCase().includes(needle) ||
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
