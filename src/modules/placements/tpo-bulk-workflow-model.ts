import { z } from "zod";
import { bulkActionCommandSchema, previewBulkAction } from "./tpo-bulk-action-model";

export const tpoBulkTargetSchema = z.enum(["STUDENTS", "APPLICATIONS"]);
export const tpoBulkActionSchema = z.enum(["ELIGIBLE", "CLEAR_OVERRIDE", "SHORTLISTED", "REJECTED"]);
const ids = z.array(z.string().uuid()).min(1).max(25)
  .refine(items => new Set(items).size === items.length, "Duplicate selected rows");

export const tpoBulkPreviewRequestSchema = z.object({
  target:tpoBulkTargetSchema,
  jobId:z.string().uuid().optional(),
  action:tpoBulkActionSchema,
  note:z.string().trim().max(1000).default(""),
  ids,
}).strict().superRefine((value,ctx)=>{
  if(value.target==="STUDENTS"){
    if(value.jobId||value.note.length>0||
       !["ELIGIBLE","CLEAR_OVERRIDE"].includes(value.action))
      ctx.addIssue({code:"custom",message:"Invalid student action"});
  } else {
    if(!value.jobId||!["SHORTLISTED","REJECTED"].includes(value.action))
      ctx.addIssue({code:"custom",message:"Invalid application action"});
    if(value.note.length<10)
      ctx.addIssue({code:"custom",message:"Screening decisions require at least ten characters of review context"});
  }
});
/** Explicit action language makes the confirmation auditable to the operator. */
export function tpoBulkActionLabel(action:z.infer<typeof tpoBulkActionSchema>):string {
  switch(action){
    case "ELIGIBLE":return "Mark learners eligible";
    case "CLEAR_OVERRIDE":return "Clear learner overrides";
    case "SHORTLISTED":return "Shortlist applicants";
    case "REJECTED":return "Reject applicants";
  }
}
export type TpoBulkPreviewRequest=z.output<typeof tpoBulkPreviewRequestSchema>;
export const tpoBulkConfirmRequestSchema = tpoBulkPreviewRequestSchema.safeExtend({
  selections:bulkActionCommandSchema.shape.selections,
  previewToken:z.string().min(10).max(256),
  confirmed:z.literal(true),
}).superRefine((value,ctx)=>{
  if(value.selections.length>25)
    ctx.addIssue({code:"custom",message:"Too many selected records"});
});
export type TpoBulkConfirmRequest=z.output<typeof tpoBulkConfirmRequestSchema>;
export function selectedBulkActionRows(ids:readonly string[],readiness:ReadonlyMap<string,{version:string;ready:boolean}>){
  return previewBulkAction(ids.map((id,index)=>({
    id,version:readiness.get(id)?.version??"unavailable",
    label:"Selected row "+(index+1),
  })),row=>{
    const state=readiness.get(row.id);
    return state?.ready?{allowed:true}:{allowed:false,reason:"Unavailable or ineligible; no change will be made"};
  });
}
export function safeBulkActionFailure(){return "Not applied; row changed or is no longer eligible";}

// DB09 remains a separate acceptance gate, even when a service is called outside a route.
export class TpoBulkApplicationsUnavailable extends Error {
  constructor(){super("DB09_MIGRATIONS_PENDING");this.name="TpoBulkApplicationsUnavailable";}
}
export function requireTpoBulkRegistered(target:"STUDENTS"|"APPLICATIONS",registered:boolean){
  if(target==="APPLICATIONS"&&!registered)throw new TpoBulkApplicationsUnavailable();
}
