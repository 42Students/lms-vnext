import {z} from "zod";
export const batchDirectoryFilterSchema=z.object({q:z.string().trim().max(100).default(""),state:z.enum(["ALL","PLANNING","INVITED","FINISHED"]).default("ALL")}).strict();
export type BatchDirectoryRow={name:string;program:string;department:string;code:string;invitedAt:Date|null;finishedAt:Date|null};
export function batchDirectoryState(row:Pick<BatchDirectoryRow,"invitedAt"|"finishedAt">){return row.finishedAt?"FINISHED" as const:row.invitedAt?"INVITED" as const:"PLANNING" as const;}
export function filterTpoBatchDirectory<T extends BatchDirectoryRow>(rows:readonly T[],query:z.infer<typeof batchDirectoryFilterSchema>){
 const q=query.q.toLocaleLowerCase();
 return rows.filter(row=>(query.state==="ALL"||batchDirectoryState(row)===query.state)&&[row.name,row.program,row.department,row.code].some(value=>value.toLocaleLowerCase().includes(q)));
}
export function batchDirectoryHref(q:string,state:z.infer<typeof batchDirectoryFilterSchema>["state"]){const p=new URLSearchParams();if(q)p.set("q",q);if(state!=="ALL")p.set("state",state);return "/tpo/batches"+(p.size?"?"+p.toString():"");}
