import { z } from "zod";
import { bulkActionCommandSchema, previewBulkAction } from "./tpo-bulk-action-model";

export const tpoBulkTargetSchema = z.enum(["STUDENTS", "APPLICATIONS"]);
export const tpoBulkActionSchema = z.enum(["ELIGIBLE", "INELIGIBLE", "CLEAR_OVERRIDE", "SHORTLISTED", "REJECTED", "ADD_NOTE", "SEND_MESSAGE", "MOVE_TEST", "MOVE_INTERVIEW"]);
const ids = z.array(z.string().uuid()).min(1).max(200)
  .refine(items => new Set(items).size === items.length, "Duplicate selected rows");

export const tpoBulkPreviewRequestSchema = z.object({
  target:tpoBulkTargetSchema,
  jobId:z.string().uuid().optional(),
  action:tpoBulkActionSchema,
  note:z.string().trim().max(1000).default(""),
  /** Private rejection reason; never shown to candidates (legacy internal/student split). */
  internalReason:z.string().trim().max(500).optional(),
  ids,
}).strict().superRefine((value,ctx)=>{
  if(value.target==="STUDENTS"){
    if(value.jobId || !["ELIGIBLE","INELIGIBLE","CLEAR_OVERRIDE"].includes(value.action) ||
       (value.action==="INELIGIBLE" ? value.note.length < 3 || value.note.length > 200 : value.note.length > 0))
      ctx.addIssue({code:"custom",message:"Invalid student action"});
    if(value.internalReason)ctx.addIssue({code:"custom",message:"Invalid student action"});
  } else {
    if(!value.jobId||!["SHORTLISTED","REJECTED","ADD_NOTE","SEND_MESSAGE","MOVE_TEST","MOVE_INTERVIEW"].includes(value.action))
      ctx.addIssue({code:"custom",message:"Invalid application action"});
    if(value.note.length<10)
      ctx.addIssue({code:"custom",message:"Screening decisions require at least ten characters of review context"});
    if(value.internalReason&&(value.action!=="REJECTED"||value.internalReason.length<3))
      ctx.addIssue({code:"custom",message:"Internal reason applies only to rejections and needs at least three characters"});
  }
});
/** Explicit action language makes the confirmation auditable to the operator. */
export function tpoBulkActionLabel(action:z.infer<typeof tpoBulkActionSchema>):string {
  switch(action){
    case "ELIGIBLE":return "Mark learners eligible";
    case "INELIGIBLE":return "Mark learners ineligible";
    case "CLEAR_OVERRIDE":return "Clear learner overrides";
    case "SHORTLISTED":return "Shortlist applicants";
    case "REJECTED":return "Reject applicants";
    case "ADD_NOTE":return "Add a note";
    case "SEND_MESSAGE":return "Send a message";
    case "MOVE_TEST":return "Move to test";
    case "MOVE_INTERVIEW":return "Move to interview";
  }
}
export type TpoBulkPreviewRequest=z.output<typeof tpoBulkPreviewRequestSchema>;
export const tpoBulkConfirmRequestSchema = tpoBulkPreviewRequestSchema.safeExtend({
  selections:bulkActionCommandSchema.shape.selections,
  previewToken:z.string().min(10).max(256),
  confirmed:z.literal(true),
  acknowledged:z.boolean().default(false),
}).superRefine((value,ctx)=>{
  if(["INELIGIBLE","REJECTED","SEND_MESSAGE","MOVE_TEST","MOVE_INTERVIEW"].includes(value.action) && !value.acknowledged)
    ctx.addIssue({code:"custom",path:["acknowledged"],message:"Acknowledge the consequences before applying."});
  if(value.selections.length>200)
    ctx.addIssue({code:"custom",message:"Too many selected records"});
});
export type TpoBulkConfirmRequest=z.output<typeof tpoBulkConfirmRequestSchema>;
export function selectedBulkActionRows(ids:readonly string[],readiness:ReadonlyMap<string,{version:string;ready:boolean;reason?:string}>){
  return previewBulkAction(ids.map((id,index)=>({
    id,version:readiness.get(id)?.version??"unavailable",
    label:"Selected row "+(index+1),
  })),row=>{
    const state=readiness.get(row.id);
    return state?.ready?{allowed:true}:{allowed:false,reason:state?.reason??"Unavailable or outside this college; no change will be made"};
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
