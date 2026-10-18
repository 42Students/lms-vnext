import {z} from "zod";

/** AUDIT saved views are owner/college private; URLs never provide either ID. */
export const tpoAuditSavedFiltersSchema=z.strictObject({
 kind:z.string().trim().max(40).default("ALL"),
 from:z.string().max(10).default(""),
 to:z.string().max(10).default(""),
 q:z.string().trim().max(120).default(""),
 who:z.string().trim().max(100).default(""),
}).superRefine((value,ctx)=>{
 for(const key of ["from","to"] as const){
  const date=value[key];
  if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date)){
   ctx.addIssue({code:"custom",path:[key],message:"Invalid calendar day"});
  }
 }
 if(value.from&&value.to&&value.from>value.to)
  ctx.addIssue({code:"custom",path:["to"],message:"End day precedes start day"});
});
const name=z.string().trim().min(1).max(50);
const id=z.uuid();
export const tpoAuditSavedViewCommandSchema=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("CREATE"),name,filters:tpoAuditSavedFiltersSchema}),
 z.strictObject({action:z.literal("RENAME"),id,name}),
 z.strictObject({action:z.literal("PIN"),id,pinned:z.boolean()}),
 z.strictObject({action:z.literal("DELETE"),id}),
 z.strictObject({action:z.literal("OPEN"),id}),
]);
export type TpoAuditSavedFilters=z.output<typeof tpoAuditSavedFiltersSchema>;
export type TpoAuditSavedViewCommand=z.output<typeof tpoAuditSavedViewCommandSchema>;
export type TpoAuditStoredView={query:TpoAuditSavedFilters;pinned:boolean;usedAt:string|null};
export type TpoAuditSavedView={
 id:string;name:string;filters:TpoAuditSavedFilters;pinned:boolean;
 usedAt:string|null;createdAt:string;
};
export function tpoAuditStoredView(raw:unknown):TpoAuditStoredView|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const data=raw as Record<string,unknown>;
 const query=tpoAuditSavedFiltersSchema.safeParse(data.query);
 if(!query.success)return null;
 return {query:query.data,pinned:data.pinned===true,
  usedAt:typeof data.usedAt==="string"&&Number.isFinite(Date.parse(data.usedAt))
   ?data.usedAt:null};
}
export function tpoAuditSavedViewHref(filters:TpoAuditSavedFilters){
 const params=new URLSearchParams();
 if(filters.kind&&filters.kind!=="ALL")params.set("kind",filters.kind);
 if(filters.from)params.set("from",filters.from);
 if(filters.to)params.set("to",filters.to);
 if(filters.q)params.set("q",filters.q);
 if(filters.who)params.set("who",filters.who);
 const qs=params.toString();
 return "/tpo/audit"+(qs?"?"+qs:"");
}
