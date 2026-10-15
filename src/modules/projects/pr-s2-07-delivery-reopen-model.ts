import {z} from "zod";
/** PR-S2-07 registered 0091 final delivery models. */
export const projectDeliveryAttachmentSchema=z.object({
  name:z.string().trim().min(1).max(255),
  kind:z.enum(["FILE","LINK"]),
  fileId:z.string().uuid().nullable(),
  url:z.url().max(2048).refine(v=>v.startsWith("https://")||v.startsWith("http://")).nullable(),
}).strict().refine(value=>value.kind==="FILE" ? Boolean(value.fileId)&&value.url===null : Boolean(value.url)&&value.fileId===null,{
  message:"File or link is required",
});
export const projectDeliveryLockInputSchema=z.object({
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  reason:z.string().trim().min(1).max(4000),
}).strict();
export function mayReopenApprovedDelivery(projectStatus:string,hasEvaluation:boolean){
  // An evaluated or already completed delivery must never be silently unlocked.
  return projectStatus==="ACTIVE"&&!hasEvaluation;
}

export const projectDeliveryAttachmentsSchema=z.array(projectDeliveryAttachmentSchema).max(10).superRefine((rows,ctx)=>{
  const keys=rows.map(row=>row.kind==="FILE"?"file:"+row.fileId:"link:"+row.url);
  if(new Set(keys).size!==keys.length)ctx.addIssue({code:"custom",message:"Duplicate attachment"});
});
