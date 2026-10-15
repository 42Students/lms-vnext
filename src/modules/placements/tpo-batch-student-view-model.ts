import {z} from "zod";
export const batchStudentViewSchema=z.object({q:z.string().trim().max(100).default("")}).strict();
export function filterBatchStudentNames<T extends {name:string}>(rows:readonly T[],q:string):T[]{
 const term=q.trim().toLocaleLowerCase("en-IN");
 if(!term)return [...rows];
 return rows.filter(row=>row.name.toLocaleLowerCase("en-IN").includes(term));
}
export function batchStudentPageHref(batchId:string,page:number,filters:{q:string}){
 const params=new URLSearchParams({page:String(page)});
 if(filters.q)params.set("q",filters.q);
 return "/tpo/batches/"+encodeURIComponent(batchId)+"/students?"+params.toString();
}
