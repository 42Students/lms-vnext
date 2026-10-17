import {z} from "zod";
export const tpoBatchPageSchema=z.object({
 page:z.coerce.number().int().min(1).max(10000).default(1),
 pageSize:z.coerce.number().int().refine(v=>[12,24,48].includes(v)).default(24),
}).strict();
export function paginateTpoBatches<T>(rows:readonly T[],page:number,pageSize:number){
 const totalPages=Math.max(1,Math.ceil(rows.length/pageSize));
 const actualPage=Math.min(Math.max(1,page),totalPages);
 const start=(actualPage-1)*pageSize,items=rows.slice(start,start+pageSize);
 return {items,total:rows.length,page:actualPage,totalPages,
  from:items.length?start+1:0,to:start+items.length,
  hasPrev:actualPage>1,hasNext:actualPage<totalPages};
}
export function tpoBatchPageHref(filters:Record<string,string|string[]|undefined>,page:number,pageSize:number){
 const q=new URLSearchParams();
 for(const [k,v] of Object.entries(filters)){
  if(Array.isArray(v)){for(const each of v){if(each)q.append(k,each);}}
  else if(v)q.set(k,v);
 }
 q.set("page",String(page));q.set("pageSize",String(pageSize));
 return "/tpo/batches?"+q.toString();
}

/** A filter reset keeps the operator's page-size preference only. */
export function tpoBatchClearFiltersHref(pageSize:number){
 return tpoBatchPageHref({},1,pageSize);
}
export function tpoBatchEmptyReason(sourceCount:number,matchingCount:number){
 return sourceCount===0?"NO_BATCHES" as const:matchingCount===0?"NO_MATCH" as const:null;
}
