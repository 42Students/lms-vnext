import {z} from "zod";
export const batchStudentViewSchema=z.object({q:z.string().trim().max(100).default(""),decision:z.enum(["ALL","ELIGIBLE","INELIGIBLE","NOT_DECIDED","NEEDS_REVIEW"]).default("ALL"),source:z.enum(["ALL","LEARNER","CLASS","BATCH","NONE"]).default("ALL"),registration:z.enum(["ALL","RECORDED","UNRECORDED"]).default("ALL")}).strict();
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
export function filterBatchStudentDecisionSource<T extends {source:string}>(rows:readonly T[],source:"ALL"|"LEARNER"|"CLASS"|"BATCH"|"NONE"):T[]{
 return source==="ALL"?[...rows]:rows.filter(row=>row.source===source);
}
export function filterBatchStudentRegistration<T extends {registration:{choice:string|null}|null}>(rows:readonly T[],registration:"ALL"|"RECORDED"|"UNRECORDED",available:boolean):T[]{
 if(registration==="ALL")return [...rows];
 if(!available)return [];
 return rows.filter(row=>registration==="RECORDED"?row.registration?.choice!=null:row.registration?.choice===null);
}
export function batchStudentPageHref(batchId:string,page:number,filters:{q:string;decision:string;source:string;registration:string}){
 const params=new URLSearchParams({page:String(page)});
 if(filters.q)params.set("q",filters.q);
 if(filters.decision!=="ALL")params.set("decision",filters.decision);
 if(filters.source!=="ALL")params.set("source",filters.source);
 if(filters.registration!=="ALL")params.set("registration",filters.registration);
 return "/tpo/batches/"+encodeURIComponent(batchId)+"/students?"+params.toString();
}
