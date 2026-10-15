import {z} from "zod";
export const batchStudentViewSchema=z.object({q:z.string().trim().max(100).default(""),decision:z.enum(["ALL","ELIGIBLE","INELIGIBLE","NOT_DECIDED","NEEDS_REVIEW"]).default("ALL")}).strict();
export function filterBatchStudentNames<T extends {name:string}>(rows:readonly T[],q:string):T[]{
 const term=q.trim().toLocaleLowerCase("en-IN");
 if(!term)return [...rows];
 return rows.filter(row=>row.name.toLocaleLowerCase("en-IN").includes(term));
}
export function filterBatchStudentDecisions<T extends {decision:string;ambiguous:boolean}>(rows:readonly T[],decision:"ALL"|"ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED"|"NEEDS_REVIEW"):T[]{
 if(decision==="ALL")return [...rows];
 if(decision==="NEEDS_REVIEW")return rows.filter(row=>row.ambiguous);
 return rows.filter(row=>!row.ambiguous&&row.decision===decision);
}
export function batchStudentPageHref(batchId:string,page:number,filters:{q:string;decision:string}){
 const params=new URLSearchParams({page:String(page)});
 if(filters.q)params.set("q",filters.q);
 if(filters.decision!=="ALL")params.set("decision",filters.decision);
 return "/tpo/batches/"+encodeURIComponent(batchId)+"/students?"+params.toString();
}
